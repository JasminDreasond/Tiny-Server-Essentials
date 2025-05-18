import { Server as HttpServer } from 'http';
import { Server as HttpsServer } from 'https';

/**
 * A strict web server wrapper that accepts only Node.js HTTP or HTTPS servers.
 */
class TinyWebInstance {
  /** @type {string[]} */
  #domains = [];

  /**
   * Creates a new TinyWebInstance bound to a Node.js HTTP or HTTPS server.
   *
   * @param {HttpServer | HttpsServer} server - A valid instance of http.Server or https.Server.
   *
   * @throws {Error} If `server` is not an instance of http.Server or https.Server.
   */
  constructor(server) {
    // @ts-ignore
    if (!(server instanceof HttpServer) && !(server instanceof HttpsServer))
      throw new Error(
        'TinyWebInstance constructor expects an instance of http.Server or https.Server only.',
      );

    /**
     * @type {HttpServer | HttpsServer}
     */
    this.server = server;
  }

  /**
   * Returns the current Http server instance.
   *
   * @returns {HttpServer | HttpsServer} The active Http server.
   */
  getServer() {
    // @ts-ignore
    if (!(this.server instanceof HttpServer) && !(this.server instanceof HttpsServer))
      throw new Error('this.server expects an instance of HttpServer or HttpsServer.');
    return this.server;
  }

  /**
   * Registers a domain string into the internal domain list.
   *
   * This can be used for domain-based routing, validation, or matching logic.
   *
   * @param {string} domain - The domain name to be registered (e.g., 'example.com').
   * @throws {Error} If the domain is not a string.
   */
  addDomain(domain) {
    if (typeof domain !== 'string') throw new Error('Domain must be a string.');
    const index = this.#domains.indexOf(domain);
    if (index > -1) throw new Error(`Domain "${domain}" already exists.`);
    this.#domains.push(domain);
  }

  /**
   * Removes a domain string from the internal domain list.
   *
   * Throws an error if the domain is not registered.
   *
   * @param {string} domain - The domain name to be removed (e.g., 'example.com').
   * @throws {Error} If the domain is not a string.
   * @throws {Error} If the domain is not found in the list.
   */
  removeDomain(domain) {
    if (typeof domain !== 'string') throw new Error('Domain must be a string.');
    const index = this.#domains.indexOf(domain);
    if (index === -1) throw new Error(`Domain "${domain}" not found.`);
    this.#domains.splice(index, 1);
  }

  /**
   * Returns a shallow clone of the internal domain list.
   *
   * This ensures the original list remains immutable from the outside.
   *
   * @returns {string[]} A cloned array containing all registered domain names.
   */
  getDomains() {
    return [...this.#domains];
  }

  /**
   * Checks whether a given host string matches a registered domain.
   *
   * This performs a strict comparison against all domains stored internally.
   *
   * @param {string} host - The host value to check (e.g., 'example.com').
   * @returns {boolean} `true` if the host matches any registered domain, otherwise `false`.
   */
  hasDomain(host) {
    for (const domain of this.#domains) if (host === domain) return true;
    return false;
  }
}

export default TinyWebInstance;
