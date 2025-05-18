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
   * @param {HttpServer | HttpsServer | number} [server] - An instance of a Node.js HTTP or HTTPS server used to bind the Socket.IO server.
   * @param {import('socket.io').ServerOptions} [options] - Configuration options for the Socket.IO server instance.
   *
   * @throws {Error} If `server` is not an instance of http.Server or https.Server.
   * @throws {Error} If `options` is not a non-null plain object.
   */
  constructor(server, options) {
    if (
      typeof server !== 'undefined' &&
      typeof server !== 'number' &&
      !(server instanceof HttpServer) &&
      // @ts-ignore
      !(server instanceof HttpsServer)
    )
      throw new Error(
        'Expected "server" to be an instance of http.Server, https.Server, or number',
      );
    if (
      typeof options !== 'undefined' &&
      (typeof options !== 'object' || options === null || Array.isArray(options))
    )
      throw new Error('Expected "options" to be a non-null object');

    this.#server =
      // @ts-ignore
      server instanceof HttpServer || server instanceof HttpsServer ? server : createServer();
    this.io = new SocketIOServer(server, options);
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
