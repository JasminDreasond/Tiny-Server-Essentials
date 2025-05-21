/**
 * @param {number} volume
 * @returns {number}
 * @throws {Error} If input is not a number
 * @throws {RangeError} If input is NaN, not finite, or out of allowed range (0–100)
 */
export const micVolumeFilter = (volume) => {
  if (typeof volume !== 'number') throw new Error('Volume must be a number.');
  if (Number.isNaN(volume) || !Number.isFinite(volume))
    throw new RangeError('Volume must be a finite number.');
  if (volume < 0 || volume > 100) throw new RangeError('Volume must be between 0 and 100.');
  return volume / 100;
};

class VolumeMeter {
  #modulePath = '/js/volume-processor.js';

  constructor() {
    /** @type {AudioContext} */
    this.context = new AudioContext();

    /** @type {number} */
    this.volume = 0.0;
  }

  /**
   * @param {string} newPath New module file path
   */
  setModulePath(newPath) {
    if (typeof newPath !== 'string') throw new TypeError('modulePath must be a string.');
    if (!newPath.trim()) throw new Error('modulePath cannot be an empty or blank string.');
    this.#modulePath = newPath;
  }

  /**
   * @param {MediaStream} stream
   * @param {boolean} [hearVoice=true]
   * @returns {Promise<void>}
   */
  async connectToSource(stream, hearVoice = true) {
    const hasAudio = stream.getAudioTracks().length > 0;
    if (!hasAudio) throw new Error('The screen capture stream does not contain any audio track.');

    // Stream
    this.stream = stream;
    stream.getTracks().forEach((track) => {
      track.addEventListener(
        'ended',
        () => {
          try {
            this.#disconnect();
          } catch {}
        },
        { once: true },
      );
    });

    // Load and register the AudioWorklet if not already loaded
    if (!this.context.audioWorklet) throw new Error('AudioWorklet not supported.');
    await this.context.audioWorklet.addModule(this.#modulePath);

    this.source = this.context.createMediaStreamSource(stream);

    // Effect
    this.gainNode = this.context.createGain();
    this.gainNode.gain.value = 1.0;

    // Connect source → gain → script (get volume status)
    this.volumeNode = new AudioWorkletNode(this.context, 'volume-processor');
    this.volumeNode.port.onmessage = (event) => {
      this.volume = event.data;
    };

    this.source.connect(this.gainNode);
    this.gainNode.connect(this.volumeNode);

    // Just connect to the output if you go to listen
    if (hearVoice) this.gainNode.connect(this.context.destination);

    // Connect script into destination
    this.volumeNode.connect(this.context.destination);
  }

  /**
   * @param {number|string} value
   * @returns {void}
   */
  setVolume(value) {
    if (this.gainNode)
      this.gainNode.gain.value =
        typeof value === 'number' || (typeof value === 'string' && value.length > 0)
          ? micVolumeFilter(Number(value))
          : 1.0;
  }

  #disconnect() {
    if (!this.source || !this.volumeNode || !this.gainNode)
      throw new Error('Cannot stop: audio nodes are not properly initialized.');
    this.source.disconnect();
    this.volumeNode.disconnect();
    this.gainNode.disconnect();
  }

  /**
   * @returns {Promise<boolean>}
   * @throws {Error} If any part of the disconnection or stopping fails
   */
  stop() {
    return new Promise(async (resolve, reject) => {
      try {
        this.#disconnect();
        if (this.stream) {
          const tracks = this.stream.getTracks();
          for (const track of tracks) track.stop();
        }
        resolve(true);
      } catch (err) {
        reject(err);
      }
    });
  }
}

export default VolumeMeter;
