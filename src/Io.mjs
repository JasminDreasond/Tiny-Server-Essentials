import { Server as HttpServer } from 'http';
import { createServer, Server as HttpsServer } from 'https';
import { Server as SocketIOServer } from 'socket.io';
import TinyWebInstance from './Instance.mjs';
import { extractIpList } from './Utils.mjs';

/** @typedef {import('socket.io').Socket} Socket */
/**
 * @typedef {number} HttpStatusCode
 */

/**
 * @typedef {(socket: Socket) => string[]} IPExtractor
 */

/**
 * @typedef {(socket: Socket) => boolean} DomainValidator
 */

/**
 * Represents the structured data extracted from an HTTP Origin header.
 *
 * @typedef {Object} OriginData
 * @property {string|null} raw - The raw Origin header value.
 * @property {string} [protocol] - The protocol used (e.g., 'http' or 'https').
 * @property {string} [hostname] - The hostname extracted from the origin.
 * @property {string} [port] - The port number (explicit or default based on protocol).
 * @property {string} [full] - The full reconstructed URL from the origin.
 * @property {string} [error] - Any parsing error encountered while processing the origin.
 */

class TinyIo {
  /** @type {HttpServer|HttpsServer|null} */
  #server = null;

  #domainTypeChecker = 'headerHost';
  #forbiddenDomainMessage = 'Forbidden domain.';

  /** @type {{ [key: string]: IPExtractor }} */
  #ipExtractors = {};

  /** @type {string} */
  #activeExtractor = 'DEFAULT';

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
   * Returns the current Http server instance.
   *
   * @returns {HttpServer | HttpsServer} The active Http server.
   */
  #getServer() {
    // @ts-ignore
    if (!(this.#server instanceof HttpServer) && !(this.#server instanceof HttpsServer))
      throw new Error(
        'this.web expects an instance of HttpServer or HttpsServer. Please execute the init().',
      );
    return this.#server;
  }

  /**
   * Creates a new instance of the Socket.IO server wrapper.
   *
   * @param {HttpServer | HttpsServer | number | import('socket.io').ServerOptions} [server] - An instance of a Node.js HTTP/HTTPS server, a port number, or Socket.IO options.
   * @param {import('socket.io').ServerOptions} [options] - Configuration options for the Socket.IO server instance.
   *
   * @throws {Error} If `server` is not a valid server, number, or object.
   * @throws {Error} If `options` is not a non-null plain object.
   */
  constructor(server, options) {
    const isServerInstance = server instanceof HttpServer || server instanceof HttpsServer;
    const isNumber = typeof server === 'number';
    const isPlainObject =
      typeof server === 'object' && server !== null && !Array.isArray(server) && !isServerInstance;

    /** @type {import('socket.io').ServerOptions} */
    // @ts-ignore
    const ops = isPlainObject && typeof options === 'undefined' ? server : options;
    if (isPlainObject && typeof options === 'undefined') server = undefined;

    if (typeof server !== 'undefined' && !isNumber && !isServerInstance)
      throw new Error(
        'Expected "server" to be an instance of http.Server, https.Server, number, or plain options object',
      );

    if (
      typeof ops !== 'undefined' &&
      (typeof ops !== 'object' || ops === null || Array.isArray(ops))
    )
      throw new Error('Expected "options" to be a non-null object');

    this.#server = server instanceof HttpServer || server instanceof HttpsServer ? server : null;
    this.root = new SocketIOServer(
      this.#server || server || ops,
      this.#server || server ? ops : undefined,
    );
    if (!this.#server) this.#server = createServer();

    this.root.on(
      'connection',
      /** @type {Socket} */
      (socket) => {
        const type = this.#domainTypeChecker;
        let valid = false;
        if (type === 'ALL') {
          const validators = Object.values(this.#domainValidators);
          for (const validator of validators) {
            if (typeof validator !== 'function')
              throw new Error(`Domain validator "${type}" is not registered.`);
            valid = validator(socket);
            if (valid) break;
          }
        } else {
          const validator = this.#domainValidators[type];
          if (typeof validator !== 'function')
            throw new Error(`Domain validator "${type}" is not registered.`);
          valid = validator(socket);
        }
        if (!valid) {
          socket.emit('force_disconnect', { reason: this.#forbiddenDomainMessage });
          socket.disconnect(true);
          return;
        }
      },
    );
  }

  /**
   * Init instance.
   *
   * @param {TinyWebInstance} [web] - An instance of TinyWebInstance.
   *
   * @throws {Error} If `web` is not an instance of TinyWebInstance.
   */
  init(web = new TinyWebInstance(this.#getServer())) {
    /** @type {TinyWebInstance} */ this.web;
    if (!(web instanceof TinyWebInstance))
      throw new Error('init expects an instance of TinyWebInstance.');
    this.web = web;

    if (!this.web.hasDomain('localhost')) this.web.addDomain('localhost');
    if (!this.web.hasDomain('127.0.0.1')) this.web.addDomain('127.0.0.1');
    if (!this.web.hasDomain('::1')) this.web.addDomain('::1');

    this.addDomainValidator('x-forwarded-host', (socket) =>
      typeof socket.handshake.headers['x-forwarded-host'] === 'string'
        ? this.web.canDomain(socket.handshake.headers['x-forwarded-host'])
        : false,
    );

    this.addDomainValidator('headerHost', (socket) =>
      typeof socket.handshake.headers.host === 'string'
        ? this.web.canDomain(socket.handshake.headers.host)
        : false,
    );

    this.addIpExtractor('ip', (socket) => extractIpList(socket.handshake.address));
    this.addIpExtractor('x-forwarded-for', (socket) =>
      extractIpList(socket.handshake.headers['x-forwarded-for']),
    );
    this.addIpExtractor('remoteAddress', (socket) =>
      extractIpList(socket.request.socket.remoteAddress),
    );
    this.addIpExtractor('fastly-client-ip', (socket) =>
      extractIpList(socket.handshake.headers['fastly-client-ip']),
    );
  }

  /**
   * Parses the Origin header from a Socket.IO connection handshake and extracts structured information.
   *
   * @param {Socket} socket - The connected Socket.IO socket instance.
   * @returns {OriginData} An object containing detailed parts of the Origin header, or error info if parsing fails.
   */
  getOrigin(socket) {
    const headers = socket.handshake.headers;

    /** @type {OriginData} */
    const originInfo = {
      raw: headers.origin || null,
    };

    try {
      if (headers.origin) {
        const url = new URL(headers.origin);
        originInfo.protocol = url.protocol.replace(':', '');
        originInfo.hostname = url.hostname;
        originInfo.port = url.port || (url.protocol === 'https:' ? '443' : '80');
        originInfo.full = url.href;
      }
    } catch (err) {
      originInfo.error = 'Invalid Origin header';
    }

    return originInfo;
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
   * Returns the current Socket.IO server instance.
   *
   * @returns {import('socket.io').Server} The active Socket.IO server.
   */
  getRoot() {
    return this.root;
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
      return (socket) => {
        const ips = [
          ...extractIpList(socket.handshake.headers['x-forwarded-for']),
          ...extractIpList(socket.handshake.address),
          ...extractIpList(socket.request.socket.remoteAddress),
        ];
        const uniqueIps = [...new Set(ips)];
        return uniqueIps;
      };
    }
    return this.#ipExtractors[this.#activeExtractor];
  }

  /**
   * Extracts the IP address from a request using the active extractor.
   * @param {Socket} socket
   * @returns {string[]}
   */
  extractIp(socket) {
    return this.getActiveExtractor()(socket);
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
}

export default TinyIo;
