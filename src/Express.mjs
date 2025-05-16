import express from 'express';
import createHttpError from 'http-errors';

/**
 * @typedef {number} HttpStatusCode
 */

class TinyExpress {
  /** @typedef {import('express').Application} ExpressApp */
  /** @typedef {import('express').Request} Request */
  /** @typedef {import('express').Response} Response */
  /** @typedef {import('express').NextFunction} NextFunction */
  /** @typedef {import('http-errors').HttpError} HttpError */

  /**
   * A list of standard HTTP status codes and their default messages.
   * Follows the format { [statusCode]: message }.
   *
   * @readonly
   * @type {Object<number|string, string>}
   */
  #httpCodes = {
    // Informational
    100: 'Continue',
    101: 'Switching Protocols',

    // Successful
    200: 'OK',
    201: 'Created',
    202: 'Accepted',
    203: 'Non-Authoritative Information',
    204: 'No Content',
    205: 'Reset Content',
    206: 'Partial Content',

    // Redirection
    300: 'Multiple Choices',
    301: 'Moved Permanently',
    302: 'Found',
    303: 'See Other',
    304: 'Not Modified',
    305: 'Use Proxy',
    306: 'Unused',
    307: 'Temporary Redirect',

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

    // Server Error
    500: 'Internal Server Error',
    501: 'Not Implemented',
    502: 'Bad Gateway',
    503: 'Service Unavailable',
    504: 'Gateway Timeout',
    505: 'HTTP Version Not Supported',
  };

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
      throw new TypeError('Expected a valid Express Response object as the first argument');
    if (typeof code !== 'number' || !Number.isInteger(code))
      throw new TypeError('Expected an integer HTTP status code as the second argument');
    const statusText = this.#httpCodes?.[code];
    if (typeof statusText !== 'string') throw new Error(`Unknown HTTP status code: ${code}`);

    res.header(`HTTP/1.0 ${code} ${this.#httpCodes[code]}`);
    return res.status(code).end();
  }

  /** @type {string[]} */
  #domains = [];

  /**
   * Creates an instance of TinyExpress.
   *
   * @constructor
   * @param {ExpressApp} app
   */
  constructor(app = express()) {
    this.app = app;
  }

  /** @param {string} domain */
  addDomain(domain) {
    if (typeof domain !== 'string') throw new Error('aaahh');
    this.#domains.push(domain);
  }

  /**
   * @param {string} host
   * @return {boolean}
   */
  #validatorsExec(host) {
    for (const domain of this.#domains) if (host === domain) return true;
    return false;
  }

  /**
   * A list of domain validators using different request properties.
   *
   * Each property in this object represents a header or request property to check the domain against.
   * Each associated array contains one or more callback functions that validate or extract the domain.
   *
   * @type {{
   *   [key: string]: (req: import('express').Request) => boolean
   * }}
   */
  #validators = {
    'x-forwarded-host': (req) => {
      return typeof req.headers['x-forwarded-host'] === 'string'
        ? this.#validatorsExec(req.headers['x-forwarded-host'])
        : false;
    },
    hostname: (req) => {
      return typeof req.hostname === 'string' ? this.#validatorsExec(req.hostname) : false;
    },
    headerHost: (req) => {
      return typeof req.headers.host === 'string' ? this.#validatorsExec(req.headers.host) : false;
    },
  };

  /**
   * @param {Object} [options={}]
   * @param {string} [options.notFoundMsg='Page not found.']
   * @param {function(HttpStatusCode, HttpError, Request, Response): void} [options.errNext]
   */
  installErrors({
    notFoundMsg = 'Page not found.',
    errNext = (status, err, req, res) => {
      res.json({
        status,
        message: err.message,
        stack: process.env.NODE_ENV === 'development' ? err.stack : null,
      });
    },
  } = {}) {
    // Middleware 404
    this.app.use(
      /** @type {function(Request, Response, NextFunction): void} */ (req, res, next) => {
        const err = createHttpError(404, notFoundMsg);
        next(err);
      },
    );

    // Middleware global de erro
    this.app.use(
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
