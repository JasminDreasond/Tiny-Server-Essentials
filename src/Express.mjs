import { createServer, Server as HttpServer } from 'http';
import { Server as HttpsServer } from 'https';
import express from 'express';
import createHttpError from 'http-errors';

import TinyWebInstance from './Instance.mjs';
import { extractIpList } from './Utils.mjs';

/**
 * @typedef {number} HttpStatusCode
 */

/**
 * @typedef {(req: import('express').Request) => string[]} IPExtractor
 */

/**
 * @typedef {(req: import('express').Request) => boolean} DomainValidator
 */

class TinyExpress {
  /** @typedef {import('express').Application} ExpressApp */
  /** @typedef {import('express').Request} Request */
  /** @typedef {import('express').Response} Response */
  /** @typedef {import('express').NextFunction} NextFunction */
  /** @typedef {import('http-errors').HttpError} HttpError */

  #domainTypeChecker = 'hostname';
  #forbiddenDomainMessage = 'Forbidden domain.';

  /** @type {{ [key: string]: IPExtractor }} */
  #ipExtractors = {};

  /** @type {string} */
  #activeExtractor = 'DEFAULT';

  /**
   * Creates and initializes a new TinyExpress instance.
   *
   * This wrapper extends the base Express application with support for domain-based request validation,
   * automatic middleware injection, and customizable validator logic.
   *
   * When instantiated, the following behaviors are applied:
   * - Injects a middleware to validate incoming requests using the active domain validator (based on `#domainTypeChecker`).
   *   If the validator does not exist or the domain is invalid, a 403 Forbidden error is triggered.
   * - Automatically registers the default loopback domains: `localhost`, `127.0.0.1`, and `::1`.
   * - Registers default domain validators for `x-forwarded-host`, `hostname`, and `host` headers.
   *
   * @constructor
   * @param {ExpressApp} [app=express()] - An optional existing Express application instance.
   *                                       If not provided, a new instance is created using `express()`.
   */
  constructor(app = express()) {
    this.root = app;
    this.root.use(
      /** @type {import('express').RequestHandler} */
      (req, res, next) => {
        const type = this.#domainTypeChecker;
        let valid = false;
        if (type === 'ALL') {
          const validators = Object.values(this.#domainValidators);
          for (const validator of validators) {
            if (typeof validator !== 'function')
              throw new Error(`Domain validator "${type}" is not registered.`);
            valid = validator(req);
            if (valid) break;
          }
        } else {
          const validator = this.#domainValidators[type];
          if (typeof validator !== 'function')
            throw new Error(`Domain validator "${type}" is not registered.`);
          valid = validator(req);
        }
        if (!valid) {
          const err = createHttpError(403, this.#forbiddenDomainMessage);
          next(err);
          return;
        }
        next();
      },
    );
  }

  /**
   * Returns the current TinyWeb instance.
   *
   * @returns {TinyWebInstance} The active Http server.
   */
  getWeb() {
    if (!(this.web instanceof TinyWebInstance))
      throw new Error('this.web expects an instance of TinyWebInstance.');
    return this.web;
  }

  /**
   * Returns the current Http server instance.
   *
   * @returns {HttpServer | HttpsServer} The active Http server.
   */
  getServer() {
    return this.getWeb().getServer();
  }

  /**
   * Returns the Express app instance.
   *
   * @returns {import('express').Application} Express application instance.
   */
  getRoot() {
    return this.root;
  }

  /**
   * Init instance.
   *
   * @param {TinyWebInstance|HttpServer|HttpsServer} [web=new TinyWebInstance()] - An instance of TinyWebInstance.
   *
   * @throws {Error} If `web` is not an instance of TinyWebInstance.
   */
  init(web = new TinyWebInstance(createServer(this.root))) {
    if (
      !(web instanceof TinyWebInstance) &&
      // @ts-ignore
      !(web instanceof HttpServer) &&
      // @ts-ignore
      !(web instanceof HttpsServer)
    )
      throw new Error('init expects an instance of TinyWebInstance, HttpServer, or HttpsServer.');

    /** @type {TinyWebInstance} */ this.web;
    if (web instanceof TinyWebInstance) this.web = web;
    else this.web = new TinyWebInstance(web);

    if (!this.web.hasDomain('localhost')) this.web.addDomain('localhost');
    if (!this.web.hasDomain('127.0.0.1')) this.web.addDomain('127.0.0.1');
    if (!this.web.hasDomain('::1')) this.web.addDomain('::1');

    this.addDomainValidator('x-forwarded-host', (req) =>
      typeof req.headers['x-forwarded-host'] === 'string'
        ? this.web.hasDomain(req.headers['x-forwarded-host'])
        : false,
    );

    this.addDomainValidator('hostname', (req) =>
      typeof req.hostname === 'string' ? this.web.hasDomain(req.hostname) : false,
    );

    this.addDomainValidator('headerHost', (req) =>
      typeof req.headers.host === 'string' ? this.web.hasDomain(req.headers.host) : false,
    );

    this.addIpExtractor('ip', (req) => extractIpList(req.ip));
    this.addIpExtractor('ips', (req) => extractIpList(req.ips));
    this.addIpExtractor('remoteAddress', (req) => extractIpList(req.socket?.remoteAddress));
    this.addIpExtractor('x-forwarded-for', (req) => extractIpList(req.headers['x-forwarded-for']));
    this.addIpExtractor('fastly-client-ip', (req) =>
      extractIpList(req.headers['fastly-client-ip']),
    );
  }

  /**
   * Registers a new IP extractor under a specific key.
   *
   * Each extractor must be a function that receives an Express `Request` and returns a string (IP) or null.
   * The key `"DEFAULT"` is reserved and cannot be used directly.
   *
   * @param {string} key
   * @param {IPExtractor} callback
   * @throws {Error} If the key is invalid or already registered.
   */
  addIpExtractor(key, callback) {
    if (typeof key !== 'string') throw new Error('Extractor key must be a string.');
    if (key === 'DEFAULT') throw new Error('"DEFAULT" is a reserved keyword.');
    if (typeof callback !== 'function') throw new Error('Extractor must be a function.');
    if (this.#ipExtractors[key]) throw new Error(`Extractor "${key}" already exists.`);
    this.#ipExtractors[key] = callback;
  }

  /**
   * Removes a registered IP extractor.
   *
   * Cannot remove the extractor currently in use unless it's set to "DEFAULT".
   *
   * @param {string} key
   * @throws {Error} If the key is invalid or in use.
   */
  removeIpExtractor(key) {
    if (typeof key !== 'string') throw new Error('Extractor key must be a string.');
    if (!(key in this.#ipExtractors)) throw new Error(`Extractor "${key}" not found.`);
    if (this.#activeExtractor === key)
      throw new Error(`Cannot remove extractor "${key}" because it is currently in use.`);
    delete this.#ipExtractors[key];
  }

  /**
   * Returns a shallow clone of the current extractors.
   *
   * @returns {{ [key: string]: IPExtractor }}
   */
  getIpExtractors() {
    return { ...this.#ipExtractors };
  }

  /**
   * Sets the currently active extractor key.
   *
   * @param {string} key
   * @throws {Error} If the key is not found.
   */
  setActiveIpExtractor(key) {
    if (key !== 'DEFAULT' && !(key in this.#ipExtractors))
      throw new Error(`Extractor "${key}" not found.`);
    this.#activeExtractor = key;
  }

  /**
   * Returns the current extractor function based on the active key.
   *
   * @returns {IPExtractor}
   */
  getActiveExtractor() {
    if (this.#activeExtractor === 'DEFAULT') {
      // Fallback behavior (standard Express logic)
      return (req) => {
        const ips = [
          ...extractIpList(req.ip),
          ...extractIpList(req.ips),
          ...extractIpList(req.socket?.remoteAddress),
        ];
        const uniqueIps = [...new Set(ips)];
        return uniqueIps;
      };
    }
    return this.#ipExtractors[this.#activeExtractor];
  }

  /**
   * Extracts the IP address from a request using the active extractor.
   * @param {import('express').Request} req
   * @returns {string[]}
   */
  extractIp(req) {
    return this.getActiveExtractor()(req);
  }

  /**
   * Registers a new domain validator under a specific key.
   *
   * Each validator must be a function that receives an Express `Request` object and returns a boolean.
   * The key `"ALL"` is reserved and cannot be used as a validator key.
   *
   * @param {string} key - The key name identifying the validator (e.g., 'host', 'x-forwarded-host').
   * @param {DomainValidator} callback - The validation function to be added.
   * @throws {Error} If the key is not a string.
   * @throws {Error} If the key is "ALL".
   * @throws {Error} If the callback is not a function.
   * @throws {Error} If a validator with the same key already exists.
   */
  addDomainValidator(key, callback) {
    if (typeof key !== 'string') throw new Error('Validator key must be a string.');
    if (key === 'ALL')
      throw new Error('"ALL" is a reserved keyword and cannot be used as a validator key.');
    if (typeof callback !== 'function') throw new Error('Validator callback must be a function.');
    if (this.#domainValidators[key]) throw new Error(`Validator with key "${key}" already exists.`);
    this.#domainValidators[key] = callback;
  }

  /**
   * Removes a registered domain validator by its key.
   *
   * Cannot remove the validator currently being used by the domain type checker,
   * unless the type checker is set to "ALL".
   *
   * @param {string} key - The key name of the validator to remove.
   * @throws {Error} If the key is not a string.
   * @throws {Error} If no validator is found under the given key.
   * @throws {Error} If the validator is currently in use by the domain type checker.
   */
  removeDomainValidator(key) {
    if (typeof key !== 'string') throw new Error('Validator key must be a string.');
    if (!(key in this.#domainValidators)) throw new Error(`Validator with key "${key}" not found.`);
    if (this.#domainTypeChecker === key)
      throw new Error(`Cannot remove validator "${key}" because it is currently in use.`);
    delete this.#domainValidators[key];
  }

  /**
   * Returns a shallow clone of the current domain validators map.
   *
   * The returned object maps each key to its corresponding validation function.
   *
   * @returns {{ [key: string]: DomainValidator }} A cloned object of the validators.
   */
  getDomainValidators() {
    return { ...this.#domainValidators };
  }

  /**
   * Sets the current domain validation strategy by key name.
   *
   * The provided key must exist in the registered domain validators,
   * or be the string `"ALL"` to enable all validators simultaneously (not recommended).
   *
   * @param {string} key - The key of the validator to use (e.g., 'hostname', 'x-forwarded-host'), or 'ALL'.
   * @throws {Error} If the key is not a string.
   * @throws {Error} If the key is not found among the validators and is not 'ALL'.
   */
  setDomainTypeChecker(key) {
    if (typeof key !== 'string') throw new Error('Domain type checker must be a string.');
    if (key !== 'ALL' && !(key in this.#domainValidators))
      throw new Error(`Validator key "${key}" is not registered.`);
    this.#domainTypeChecker = key;
  }

  /**
   * A list of standard HTTP status codes, their default messages,
   * and some common non-official or less standard status codes.
   * Follows the format { [statusCode]: message }.
   *
   * @readonly
   * @type {Object<number|string, string>}
   */
  #httpCodes = {
    // Informational
    100: 'Continue',
    101: 'Switching Protocols',
    102: 'Processing', // WebDAV
    103: 'Early Hints', // RFC 8297

    // Successful
    200: 'OK',
    201: 'Created',
    202: 'Accepted',
    203: 'Non-Authoritative Information',
    204: 'No Content',
    205: 'Reset Content',
    206: 'Partial Content',
    207: 'Multi-Status', // WebDAV
    208: 'Already Reported', // WebDAV
    226: 'IM Used', // HTTP Delta encoding

    // Redirection
    300: 'Multiple Choices',
    301: 'Moved Permanently',
    302: 'Found',
    303: 'See Other',
    304: 'Not Modified',
    305: 'Use Proxy',
    306: 'Unused',
    307: 'Temporary Redirect',
    308: 'Permanent Redirect', // RFC 7538

    // Client Error
    400: 'Bad Request',
    401: 'Unauthorized',
    402: 'Payment Required',
    403: 'Forbidden',
    404: 'Not Found',
    405: 'Method Not Allowed',
    406: 'Not Acceptable',
    407: 'Proxy Authentication Required',
    408: 'Request Timeout',
    409: 'Conflict',
    410: 'Gone',
    411: 'Length Required',
    412: 'Precondition Failed',
    413: 'Request Entity Too Large',
    414: 'Request-URI Too Long',
    415: 'Unsupported Media Type',
    416: 'Requested Range Not Satisfiable',
    417: 'Expectation Failed',
    418: "I'm a teapot", // RFC 2324 (April Fools)
    421: 'Misdirected Request', // RFC 7540
    422: 'Unprocessable Entity', // WebDAV
    423: 'Locked', // WebDAV
    424: 'Failed Dependency', // WebDAV
    425: 'Too Early', // RFC 8470
    426: 'Upgrade Required',
    428: 'Precondition Required', // RFC 6585
    429: 'Too Many Requests', // RFC 6585
    431: 'Request Header Fields Too Large', // RFC 6585
    451: 'Unavailable For Legal Reasons', // RFC 7725

    // Server Error
    500: 'Internal Server Error',
    501: 'Not Implemented',
    502: 'Bad Gateway',
    503: 'Service Unavailable',
    504: 'Gateway Timeout',
    505: 'HTTP Version Not Supported',
    506: 'Variant Also Negotiates', // RFC 2295
    507: 'Insufficient Storage', // WebDAV
    508: 'Loop Detected', // WebDAV
    510: 'Not Extended', // RFC 2774
    511: 'Network Authentication Required', // RFC 6585

    // Common but unofficial
    520: 'Web Server Returned an Unknown Error', // Cloudflare
    521: 'Web Server Is Down', // Cloudflare
    522: 'Connection Timed Out', // Cloudflare
    523: 'Origin Is Unreachable', // Cloudflare
    524: 'A Timeout Occurred', // Cloudflare
    525: 'SSL Handshake Failed', // Cloudflare
    526: 'Invalid SSL Certificate', // Cloudflare
  };

  /**
   * Retrieves the HTTP status message for a given status code.
   *
   * @param {number|string} code - The HTTP status code to look up.
   * @returns {string} The corresponding HTTP status message.
   * @throws {Error} If the status code is not found.
   */
  getHttpStatusMessage(code) {
    const message = this.#httpCodes[code];
    if (typeof message !== 'string')
      throw new Error(`HTTP status code "${code}" is not registered.`);
    return message;
  }

  /**
   * Checks whether a given HTTP status code is registered.
   *
   * @param {number|string} code - The HTTP status code to check.
   * @returns {boolean} `true` if the status code exists, otherwise `false`.
   */
  hasHttpStatusMessage(code) {
    return typeof this.#httpCodes[code] === 'string';
  }

  /**
   * Adds a new HTTP status code and message to the list.
   * Does not allow overwriting existing codes.
   *
   * @param {number|string} code - The HTTP status code to add.
   * @param {string} message - The message associated with the code.
   * @throws {Error} If the code already exists.
   * @throws {Error} If the code is not a number or string.
   * @throws {Error} If the message is not a string.
   */
  addHttpCode(code, message) {
    if (typeof code !== 'number' && typeof code !== 'string')
      throw new Error('HTTP status code must be a number or string.');
    if (typeof message !== 'string') throw new Error('HTTP status message must be a string.');
    if (this.#httpCodes.hasOwnProperty(code))
      throw new Error(`HTTP status code "${code}" already exists.`);
    this.#httpCodes[code] = message;
  }

  /**
   * Sends an HTTP response with the given status code.
   * If a callback is provided, it will be called instead of sending an empty response.
   *
   * @param {import('express').Response} res - Express response object.
   * @param {number} code - HTTP status code to send.
   *
   * @returns {import('express').Response} The result of `res.send()` or the callback function.
   *
   * @example
   * appManager.send(res, 404); // Sends 404 Not Found with empty body
   */
  sendHttpError(res, code) {
    if (!res || typeof res.status !== 'function' || typeof res.send !== 'function')
      throw new Error('Expected a valid Express Response object as the first argument');
    if (typeof code !== 'number' || !Number.isInteger(code))
      throw new Error('Expected an integer HTTP status code as the second argument');
    const statusText = this.#httpCodes?.[code];
    if (typeof statusText !== 'string') throw new Error(`Unknown HTTP status code: ${code}`);

    res.header(`HTTP/1.0 ${code} ${this.#httpCodes[code]}`);
    return res.status(code).end();
  }

  /**
   * A list of domain validators using different request properties.
   *
   * Each property in this object represents a header or request property to check the domain against.
   * Each associated array contains one or more callback functions that validate or extract the domain.
   *
   * @type {{
   *   [key: string]: DomainValidator
   * }}
   */
  #domainValidators = {};

  /**
   * Installs default error-handling middleware into the Express app instance.
   *
   * This includes:
   * - A catch-all 404 handler that throws a `HttpError` when no routes match.
   * - A global error handler that responds with a JSON-formatted error response,
   *   including the stack trace in development environments.
   *
   * @param {Object} [options={}]
   * @param {string} [options.notFoundMsg='Page not found.']
   * @param {function(HttpStatusCode, HttpError, Request, Response): any} [options.errNext]
   */
  installErrors({
    notFoundMsg = 'Page not found.',
    errNext = (status, err, req, res) => {
      res.json({
        status,
        message:
          typeof err.message === 'string'
            ? err.message
            : this.hasHttpStatusMessage(status)
              ? this.getHttpStatusMessage(status)
              : '',
        stack: process.env.NODE_ENV === 'development' ? err.stack : null,
      });
    },
  } = {}) {
    const app = this.getRoot();
    // Middleware 404
    app.use(
      /** @type {function(Request, Response, NextFunction): void} */ (req, res, next) => {
        const err = createHttpError(404, notFoundMsg);
        next(err);
      },
    );

    // Middleware global de erro
    app.use(
      /** @type {function(HttpError, Request, Response, NextFunction): void} */
      (err, req, res, next) => {
        const status = err.status || err.statusCode || 500;
        res.status(status);
        errNext(status, err, req, res);
      },
    );
  }
}

export default TinyExpress;
