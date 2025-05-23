import { EventEmitter } from 'events';

/** @typedef {'video'|'audio'|HTMLVideoElement|HTMLAudioElement} ReceiverTags */

class TinyMediaReceiver {
  /**
   * Important instance used to make event emitter.
   * @type {EventEmitter}
   */
  #events = new EventEmitter();

  /**
   * Important instance used to make system event emitter.
   * @type {EventEmitter}
   */
  #sysEvents = new EventEmitter();
  #sysEventsUsed = false;

  /**
   * Event labels used internally and externally for stream control and monitoring.
   * These events are emitted or listened to over socket or internal dispatch.
   * @readonly
   */
  Events = {
    /**
     * Emitted when the buffer has been successfully cleaned.
     * Useful for freeing up memory or managing playback state.
     * @type {'BufferCleaned'}
     */
    BufferCleaned: 'BufferCleaned',

    /**
     * Emitted to synchronize the playback time, typically used
     * when aligning multiple streams or correcting drift.
     * @type {'SyncTime'}
     */
    SyncTime: 'SyncTime',

    /**
     * Event name emitted when the instance is destroyed.
     * This constant can be used to subscribe to the destruction event of the instance.
     * @type {'Destroyed'}
     */
    Destroyed: 'Destroyed',

    /**
     * Emitted when an error occurs in the stream process.
     * Can be used to log or handle critical failures.
     * @type {'Error'}
     */
    Error: 'Error',

    /**
     * Emitted when the MediaSource becomes open and is ready for SourceBuffer initialization.
     * @type {'SourceOpen'}
     */
    SourceOpen: 'SourceOpen',

    /**
     * Emitted when a new chunk of data is being fed into the SourceBuffer queue.
     * Useful for tracking data flow or debugging buffering behavior.
     * @type {'FeedQueue'}
     */
    FeedQueue: 'FeedQueue',
  };

  /**
   * Checks whether a given event name is defined in the Events map.
   *
   * This method verifies if the provided string matches one of the predefined
   * event labels (e.g., "Mic", "Cam", "Screen", "MicMeter", "ScreenMeter").
   *
   * @param {string} name - The name of the event to check.
   * @returns {boolean} Returns `true` if the event exists in the Events map, otherwise `false`.
   */
  existsEvent(name) {
    // @ts-ignore
    if (typeof this.Events[name] === 'string') return true;
    return false;
  }

  /**
   * Emits an event with optional arguments to all system emit.
   * @param {string | symbol} event - The name of the event to emit.
   * @param {...any} args - Arguments passed to event listeners.
   */
  #emit(event, ...args) {
    this.#events.emit(event, ...args);
    if (this.#sysEventsUsed) this.#sysEvents.emit(event, ...args);
  }

  /**
   * Provides access to a secure internal EventEmitter for subclass use only.
   *
   * This method exposes a dedicated EventEmitter instance intended specifically for subclasses
   * that extend the main class. It prevents subclasses from accidentally or intentionally using
   * the primary class's public event system (`emit`), which could lead to unpredictable behavior
   * or interference in the base class's event flow.
   *
   * For security and consistency, this method is designed to be accessed only once.
   * Multiple accesses are blocked to avoid leaks or misuse of the internal event bus.
   *
   * @returns {EventEmitter} A special internal EventEmitter instance for subclass use.
   * @throws {Error} If the method is called more than once.
   */
  getSysEvents() {
    if (this.#sysEventsUsed)
      throw new Error(
        'Access denied: getSysEvents() can only be called once. ' +
          'This restriction ensures subclass event isolation and prevents accidental interference ' +
          'with the main class event emitter.',
      );
    this.#sysEventsUsed = true;
    return this.#sysEvents;
  }

  /**
   * @typedef {(...args: any[]) => void} ListenerCallback
   * A generic callback function used for event listeners.
   */

  /**
   * Sets the maximum number of listeners for the internal event emitter.
   *
   * @param {number} max - The maximum number of listeners allowed.
   */
  setMaxListeners(max) {
    this.#events.setMaxListeners(max);
  }

  /**
   * Emits an event with optional arguments.
   * @param {string | symbol} event - The name of the event to emit.
   * @param {...any} args - Arguments passed to event listeners.
   * @returns {boolean} `true` if the event had listeners, `false` otherwise.
   */
  emit(event, ...args) {
    return this.#events.emit(event, ...args);
  }

  /**
   * Registers a listener for the specified event.
   * @param {string | symbol} event - The name of the event to listen for.
   * @param {ListenerCallback} listener - The callback function to invoke.
   * @returns {this} The current class instance (for chaining).
   */
  on(event, listener) {
    this.#events.on(event, listener);
    return this;
  }

  /**
   * Registers a one-time listener for the specified event.
   * @param {string | symbol} event - The name of the event to listen for once.
   * @param {ListenerCallback} listener - The callback function to invoke.
   * @returns {this} The current class instance (for chaining).
   */
  once(event, listener) {
    this.#events.once(event, listener);
    return this;
  }

  /**
   * Removes a listener from the specified event.
   * @param {string | symbol} event - The name of the event.
   * @param {ListenerCallback} listener - The listener to remove.
   * @returns {this} The current class instance (for chaining).
   */
  off(event, listener) {
    this.#events.off(event, listener);
    return this;
  }

  /**
   * Alias for `on`.
   * @param {string | symbol} event - The name of the event.
   * @param {ListenerCallback} listener - The callback to register.
   * @returns {this} The current class instance (for chaining).
   */
  addListener(event, listener) {
    this.#events.addListener(event, listener);
    return this;
  }

  /**
   * Alias for `off`.
   * @param {string | symbol} event - The name of the event.
   * @param {ListenerCallback} listener - The listener to remove.
   * @returns {this} The current class instance (for chaining).
   */
  removeListener(event, listener) {
    this.#events.removeListener(event, listener);
    return this;
  }

  /**
   * Removes all listeners for a specific event, or all events if no event is specified.
   * @param {string | symbol} [event] - The name of the event. If omitted, all listeners from all events will be removed.
   * @returns {this} The current class instance (for chaining).
   */
  removeAllListeners(event) {
    this.#events.removeAllListeners(event);
    return this;
  }

  /**
   * Returns the number of times the given `listener` is registered for the specified `event`.
   * If no `listener` is passed, returns how many listeners are registered for the `event`.
   * @param {string | symbol} eventName - The name of the event.
   * @param {Function} [listener] - Optional listener function to count.
   * @returns {number} Number of matching listeners.
   */
  listenerCount(eventName, listener) {
    return this.#events.listenerCount(eventName, listener);
  }

  /**
   * Adds a listener function to the **beginning** of the listeners array for the specified event.
   * The listener is called every time the event is emitted.
   * @param {string | symbol} eventName - The event name.
   * @param {ListenerCallback} listener - The callback function.
   * @returns {this} The current class instance (for chaining).
   */
  prependListener(eventName, listener) {
    this.#events.prependListener(eventName, listener);
    return this;
  }

  /**
   * Adds a **one-time** listener function to the **beginning** of the listeners array.
   * The next time the event is triggered, this listener is removed and then invoked.
   * @param {string | symbol} eventName - The event name.
   * @param {ListenerCallback} listener - The callback function.
   * @returns {this} The current class instance (for chaining).
   */
  prependOnceListener(eventName, listener) {
    this.#events.prependOnceListener(eventName, listener);
    return this;
  }

  /**
   * Returns an array of event names for which listeners are currently registered.
   * @returns {(string | symbol)[]} Array of event names.
   */
  eventNames() {
    return this.#events.eventNames();
  }

  /**
   * Gets the current maximum number of listeners allowed for any single event.
   * @returns {number} The max listener count.
   */
  getMaxListeners() {
    return this.#events.getMaxListeners();
  }

  /**
   * Returns a copy of the listeners array for the specified event.
   * @param {string | symbol} eventName - The event name.
   * @returns {Function[]} An array of listener functions.
   */
  listeners(eventName) {
    return this.#events.listeners(eventName);
  }

  /**
   * Returns a copy of the internal listeners array for the specified event,
   * including wrapper functions like those used by `.once()`.
   * @param {string | symbol} eventName - The event name.
   * @returns {Function[]} An array of raw listener functions.
   */
  rawListeners(eventName) {
    return this.#events.rawListeners(eventName);
  }

  /** @type {HTMLMediaElement|null} */
  #element = null;
  #url = '';

  _onSourceOpen() {
    if (!MediaSource.isTypeSupported(this.mimeType)) {
      const err = new Error(`MIME type ${this.mimeType} not supported.`);
      console.error(err);
      this.#emit(this.Events.Error, err);
      this.destroy();
      return;
    }

    this.sourceBuffer = this.mediaSource.addSourceBuffer(this.mimeType);
    this.sourceBuffer.mode = 'sequence'; // garante ordem
    this.sourceBuffer.addEventListener('updateend', () => this._feedQueue());
    this.#emit(this.Events.SourceOpen);
    this._feedQueue();
  }

  _feedQueue() {
    if (!this.sourceBuffer || this.queue.length === 0 || this.sourceBuffer.updating) return;
    const chunk = this.queue.shift();
    try {
      this.#emit(this.Events.FeedQueue, chunk);
      // @ts-ignore
      this.sourceBuffer.appendBuffer(chunk);
      if (this.queue.length > 0) this._feedQueue();
    } catch (e) {
      console.error('Failed to append buffer:', e);
      this.#emit(this.Events.Error, e);
      this.destroy();
    }
  }

  _cleanupBuffer() {
    if (!this.sourceBuffer || !this.#element) return;
    if (!this.sourceBuffer.buffered || this.sourceBuffer.updating) return;

    const media = this.#element;
    const buffered = this.sourceBuffer.buffered;
    const maxBack = this.getMaxBufferBack();
    const tolerance = 0.1;

    if (buffered.length === 0) return;

    const bufferStart = buffered.start(0);
    const bufferEnd = buffered.end(buffered.length - 1);
    const bufferedDuration = bufferEnd - bufferStart;

    // Cleans only if the buffer total exceeds the limit
    if (bufferedDuration > maxBack + tolerance) {
      const extra = bufferedDuration - maxBack;
      const removeEnd = bufferStart + extra;

      try {
        this.sourceBuffer.remove(bufferStart, removeEnd);
        this.#emit?.(this.Events.BufferCleaned, { from: bufferStart, to: removeEnd });
      } catch (e) {
        console.warn('Failed to clean buffer range:', e);
      }
    }

    // Fixes currentTime if it leaves the allowed range
    const idealTime = bufferEnd - 0.1;
    const minTime = bufferEnd - maxBack;

    if (media.currentTime < minTime + tolerance || media.currentTime > bufferEnd - tolerance) {
      media.currentTime = idealTime;
      this.#emit?.(this.Events.SyncTime, idealTime);
    }
  }

  /**
   * Initializes a media player for continuous streaming from received chunks.
   *
   * @param {ReceiverTags} element - The tag to attach the stream.
   * @param {string} mimeType - The mime type, e.g., 'audio/webm;codecs=opus'.
   * @param {number} [maxBufferBack=10] - Maximum buffer back to keep in the buffer behind the current time.
   */
  constructor(element, mimeType, maxBufferBack = 10) {
    if (!MediaSource.isTypeSupported(mimeType))
      throw new Error(`MIME type not supported: ${mimeType}`);
    if (!Number.isInteger(maxBufferBack) || maxBufferBack <= 0)
      throw new Error('Expected a positive number in maxBufferBack.');

    this.mimeType = mimeType;
    /** @type {BufferSource[]} */
    this.queue = [];
    this.sourceBuffer = null;
    this.mediaSource = new MediaSource();
    this.isBufferUpdating = false;
    this.isEnded = false;
    this.maxBufferBack = maxBufferBack;

    if (typeof element === 'string') {
      if (element !== 'audio' && element !== 'video')
        throw new Error("element must be either 'audio' or 'video'.");
      this.#element = document.createElement(element);
    } else if (element instanceof HTMLMediaElement) this.#element = element;
    else throw new Error('Expected a string (tag name) or an HTMLMediaElement instance.');

    this.#element.src = this.#url;
    this.#element.src = URL.createObjectURL(this.mediaSource);
    this.mediaSource.addEventListener('sourceopen', () => {
      this._onSourceOpen();
    });

    setInterval(() => this._cleanupBuffer(), 100);
  }

  /**
   * Gets the maximum buffer back.
   * Only returns a positive integer.
   * @returns {number}
   */
  getMaxBufferBack() {
    if (!Number.isInteger(this.maxBufferBack) || this.maxBufferBack <= 0)
      throw new Error(
        `[MediaStream] Invalid internal maxBufferBack detected (${this.maxBufferBack}), resetting to 30.`,
      );
    return this.maxBufferBack;
  }

  /**
   * Sets the maximum buffer back.
   * Value must be a positive integer.
   * @param {number} value
   */
  setMaxBufferBack(value) {
    if (!Number.isInteger(value) || value <= 0)
      throw new Error(`[MediaStream] maxBufferBack must be a positive integer. Received: ${value}`);
    this.maxBufferBack = value;
  }

  /** @returns {HTMLMediaElement} */
  getElement() {
    if (!(this.#element instanceof HTMLMediaElement))
      throw new Error('Element is not a valid HTMLMediaElement');
    return this.#element;
  }

  /**
   * Pushes a new chunk of media data to the playback buffer.
   * @param {ArrayBuffer} buffer
   */
  pushChunk(buffer) {
    if (this.isEnded) return new Promise((resolve) => resolve(undefined));
    this.queue.push(buffer);
    this._feedQueue();
  }

  /**
   * Alias for `pushChunk`.
   * @param {ArrayBuffer} buffer
   */
  push(buffer) {
    return this.pushChunk(buffer);
  }

  /**
   * Finalizes the media stream and releases resources.
   */
  destroy() {
    if (!this.isEnded && this.mediaSource.readyState === 'open') {
      this.isEnded = true;
      const tryEnd = () => {
        if (!this.sourceBuffer) throw new Error('No sourcerBuffer');
        if (!this.sourceBuffer.updating && this.mediaSource.readyState === 'open') {
          this.mediaSource.endOfStream();
          URL.revokeObjectURL(this.#url);
          if (this.#element) {
            this.#element.remove();
            this.#element = null;
          }
          this.#emit(this.Events.Destroyed);
          this.#events.removeAllListeners();
          this.#sysEvents.removeAllListeners();
        } else {
          setTimeout(tryEnd, 100);
        }
      };
      tryEnd();
    }
  }
}

export default TinyMediaReceiver;
