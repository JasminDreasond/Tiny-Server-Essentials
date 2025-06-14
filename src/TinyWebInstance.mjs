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
   * Removes the port number from an IPv4, IPv6, or hostname.
   *
   * @param {string} host - The raw host string possibly including a port.
   * @returns {string} The host string without any port.
   */
  stripPort(host) {
    // IPv6 with port: [2001:db8::1]:443 -> [2001:db8::1]
    if (host.startsWith('[')) {
      const idx = host.indexOf(']');
      if (idx !== -1) return host.slice(0, idx + 1);
    }

    // Hostname or IPv4 with port: example.com:8080 or 192.168.0.1:3000
    const idx = host.indexOf(':');
    if (idx !== -1 && host.indexOf(':', idx + 1) === -1) {
      return host.slice(0, idx);
    }

    return host;
  }

  /**
   * Determines whether the specified host is allowed based on the registered domain list.
   *
   * Performs a strict comparison between the cleaned host and each stored domain.
   * The special value `'0.0.0.0'` acts as a wildcard, allowing any host to match.
   * To allow all hosts, ensure that `'0.0.0.0'` is included in the domain list.
   *
   * @param {string} host - The host to check (e.g., 'example.com', '192.168.0.1:8080').
   * @returns {boolean} Returns `true` if the host matches any registered domain; otherwise, `false`.
   */
  canDomain(host) {
    const cleanHost = this.stripPort(host);
    for (const domain of this.#domains) {
      if (domain === '0.0.0.0' || cleanHost === domain) return true;
    }
    return false;
  }

  /**
   * Checks whether a given host string matches a registered domain.
   *
   * This performs a strict comparison against all domains stored internally.
   *
   * @param {string} host - The host value to check (e.g., 'example.com', '192.168.0.1:8080').
   * @returns {boolean} `true` if the host matches any registered domain, otherwise `false`.
   */
  hasDomain(host) {
    const cleanHost = this.stripPort(host);
    for (const domain of this.#domains) {
      if (cleanHost === domain) return true;
    }
    return false;
  }
}

export default TinyWebInstance;
