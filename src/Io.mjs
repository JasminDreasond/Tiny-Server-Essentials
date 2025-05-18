import { Server as HttpServer } from 'http';
import { createServer, Server as HttpsServer } from 'https';
import { Server as SocketIOServer } from 'socket.io';
import TinyWebInstance from './Instance.mjs';

class TinyIo {
  /** @type {HttpServer|HttpsServer|null} */
  #server = null;

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
    this.io = new SocketIOServer(
      this.#server || server || ops,
      this.#server || server ? ops : undefined,
    );
    if (!this.#server) this.#server = createServer();
  }

  /**
   * Init instance.
   *
   * @param {TinyWebInstance} [web] - An instance of TinyWebInstance.
   *
   * @throws {Error} If `web` is not an instance of TinyWebInstance.
   */
  init(web = new TinyWebInstance(this.#getServer())) {
    if (!(web instanceof TinyWebInstance))
      throw new Error('init expects an instance of TinyWebInstance.');
    this.web = web;

    if (!this.web.hasDomain('localhost')) this.web.addDomain('localhost');
    if (!this.web.hasDomain('127.0.0.1')) this.web.addDomain('127.0.0.1');
    if (!this.web.hasDomain('::1')) this.web.addDomain('::1');
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
    return this.io;
  }
}

export default TinyIo;
