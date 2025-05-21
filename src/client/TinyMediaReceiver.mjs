class TinyMediaReceiver {
  /** @type {HTMLMediaElement|null} */
  #element = null;
  #url = '';

  /**
   * Initializes a media player for continuous streaming from received chunks.
   *
   * @param {'video'|'audio'} elementName - The tag name needs to be `audio` or `video` to attach the stream.
   * @param {string} mimeType - The mime type, e.g., 'audio/webm;codecs=opus'.
   */
  constructor(elementName, mimeType) {
    if (!window.MediaSource) throw new Error('MediaSource is not supported in this browser.');

    this.mimeType = mimeType;
    /** @type {BufferSource[]} */
    this.queue = [];
    this.sourceBuffer = null;
    this.mediaSource = new MediaSource();
    this.isBufferUpdating = false;
    this.isEnded = false;

    this.#element = document.createElement(elementName);
    this.#element.src = this.#url;
    this.#element.src = URL.createObjectURL(this.mediaSource);

    this.mediaSource.addEventListener('sourceopen', () => {
      this._onSourceOpen();
    });
  }

  _onSourceOpen() {
    if (!MediaSource.isTypeSupported(this.mimeType)) {
      console.error(`MIME type ${this.mimeType} not supported.`);
      return;
    }

    this.sourceBuffer = this.mediaSource.addSourceBuffer(this.mimeType);
    this.sourceBuffer.mode = 'sequence'; // garante ordem
    this.sourceBuffer.addEventListener('updateend', () => this._feedQueue());
    this._feedQueue();
  }

  _feedQueue() {
    if (!this.sourceBuffer) return;
    if (this.queue.length === 0 || this.sourceBuffer.updating) return;

    const chunk = this.queue.shift();
    if (this.sourceBuffer) {
      try {
        // @ts-ignore
        this.sourceBuffer.appendBuffer(chunk);
      } catch (e) {
        console.error('Failed to append buffer:', e);
      }
    }
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
    if (this.isEnded) return;
    this.queue.push(buffer);
    this._feedQueue();
  }

  /**
   * Finalizes the media stream and releases resources.
   */
  destroy() {
    if (this.mediaSource.readyState === 'open') {
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
        } else {
          setTimeout(tryEnd, 100);
        }
      };
      tryEnd();
    }
  }
}

export default TinyMediaReceiver;
