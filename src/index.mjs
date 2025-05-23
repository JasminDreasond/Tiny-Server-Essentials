import * as Utils from './Utils.mjs';
import TinyWebInstance from './Instance.mjs';
import TinyExpress from './Express.mjs';
import TinyIo from './Io.mjs';

/**
 * Central access point for all essential modules provided by the TinyWeb toolkit.
 *
 * This class acts as a namespace-like container to group the Express, Socket.IO,
 * server instance tools, and utility features in a unified API.
 *
 * Example:
 * ```js
 * import TinyWebEssentials from 'tiny-server-essentials';
 *
 * const server1 = TinyWebEssentials.Express();
 * const server2 = TinyWebEssentials.Io();
 * const instance = new TinyWebEssentials.Instance();
 * ```
 */
class TinyWebEssentials {
  /**
   * Utility functions such as IP extractors and filters.
   */
  static Utils = Utils;

  static Instance = TinyWebInstance;
  static Express = TinyExpress;
  static Io = TinyIo;

  /**
   * This constructor is intentionally blocked.
   *
   * ⚠️ You must NOT instantiate TinyWebEssentials directly.
   * To create a working instance, use {@link TinyWebEssentials.Express}, and {@link TinyWebEssentials.Io}:
   *
   * ```js
   * const server = new TinyWebEssentials.Express();
   * ```
   *
   * ```js
   * const server = TinyWebEssentials.Io();
   * ```
   *
   * @constructor
   * @throws {Error} Always throws an error to prevent direct instantiation.
   */
  constructor() {
    throw new Error(
      'You must use new TinyWebEssentials.Express() or TinyWebEssentials.Io() to create your new instance.',
    );
  }
}

export default TinyWebEssentials;
