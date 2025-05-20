import { TinyPromiseQueue } from 'tiny-essentials';
/** @typedef {import('socket.io').Socket} Socket */

export class TinyStreamManager {
  #loadingDevices = false;
  #queue = new TinyPromiseQueue();

  /**
   * @type {{
   *  audio: MediaDeviceInfo[];
   *  speaker: MediaDeviceInfo[];
   *  video: MediaDeviceInfo[];
   * }}
   */
  #devices = {
    audio: [],
    speaker: [],
    video: [],
  };

  /** @type {MediaStream|null} */
  micStream = null;
  /** @type {MediaStream|null} */
  camStream = null;
  /** @type {MediaStream|null} */
  screenStream = null;

  /**
   * Returns the current microphone stream if it is a valid MediaStream.
   *
   * @returns {MediaStream} The active microphone stream.
   * @throws {Error} If the microphone stream is not a valid MediaStream.
   */
  getMicStream() {
    if (!(this.micStream instanceof MediaStream))
      throw new Error('Microphone stream is not a valid MediaStream');
    return this.micStream;
  }

  /**
   * Returns the current webcam stream if it is a valid MediaStream.
   *
   * @returns {MediaStream} The active webcam stream.
   * @throws {Error} If the webcam stream is not a valid MediaStream.
   */
  getCamStream() {
    if (!(this.camStream instanceof MediaStream))
      throw new Error('Webcam stream is not a valid MediaStream');
    return this.camStream;
  }

  /**
   * Returns the current screen sharing stream if it is a valid MediaStream.
   *
   * @returns {MediaStream} The active screen sharing stream.
   * @throws {Error} If the screen stream is not a valid MediaStream.
   */
  getScreenStream() {
    if (!(this.screenStream instanceof MediaStream))
      throw new Error('Screen stream is not a valid MediaStream');
    return this.screenStream;
  }

  /**
   * Creates an instance of the media device manager.
   *
   * This constructor initializes the internal socket reference and sets up the default
   * structure for tracking media devices and active media streams. It also automatically
   * triggers a device list update on instantiation.
   *
   * @param {Socket} socket - The socket instance used for communication.
   */
  constructor(socket) {
    /** @type {Socket} */
    this.socket = socket;
    this.updateDeviceList();
  }

  /**
   * Updates the internal list of available media devices.
   *
   * This method queries the user's system for media input and output devices using
   * `navigator.mediaDevices.enumerateDevices()` and categorizes them into three groups:
   * video inputs, audio inputs, and audio outputs (speakers). The result is stored in the
   * `this.devices` object and also returned for immediate use.
   *
   * If the device list cannot be retrieved, it falls back to setting all categories as empty arrays.
   *
   * @returns {Promise<{ video: MediaDeviceInfo[], audio: MediaDeviceInfo[], speaker: MediaDeviceInfo[] }>}
   *          A promise resolving to an object containing categorized media devices.
   */
  async updateDeviceList() {
    if (!this.#loadingDevices) {
      this.#loadingDevices = true;
      await this.#queue.enqueue(async () => {
        const devicesResult = await navigator.mediaDevices?.enumerateDevices?.();
        if (devicesResult) {
          const video = [];
          const audio = [];
          const speaker = [];

          for (const device of devicesResult) {
            switch (device.kind) {
              case 'videoinput':
                video.push(device);
                break;
              case 'audioinput':
                audio.push(device);
                break;
              case 'audiooutput':
                speaker.push(device);
                break;
            }
          }

          this.#devices.audio = audio;
          this.#devices.speaker = speaker;
          this.#devices.video = video;
        } else {
          this.#devices.audio = [];
          this.#devices.speaker = [];
          this.#devices.video = [];
        }
      });
      this.#loadingDevices = false;
    } else await this.#queue.enqueuePoint(async () => {});
    return {
      video: this.#devices.video,
      audio: this.#devices.audio,
      speaker: this.#devices.speaker,
    };
  }

  /**
   * Retrieves a list of media devices filtered by the specified kind.
   *
   * This method strictly enforces the kind to be one of: 'audio', 'video', or 'speaker'.
   * It throws an error if the input is not a string, not one of the allowed kinds,
   * or if no devices are available for the given kind.
   *
   * @param {'audio' | 'video' | 'speaker'} kind - The type of device to retrieve.
   * @returns {MediaDeviceInfo[]} An array of media devices matching the specified kind.
   * @throws {TypeError} If the input is not a string.
   * @throws {RangeError} If the input is not one of the accepted device kinds.
   * @throws {Error} If no devices are found for the given kind.
   */
  getDevicesByKind(kind) {
    if (typeof kind !== 'string') throw new TypeError('Parameter "kind" must be a string');
    if (!['audio', 'video', 'speaker'].includes(kind))
      throw new RangeError('Parameter "kind" must be one of: "audio", "video", "speaker"');
    const devices = this.#devices[kind];
    if (!devices) throw new Error(`No devices found for kind: "${kind}"`);
    return devices;
  }

  /**
   * Starts capturing audio from the microphone with flexible constraints.
   *
   * If a deviceId is provided, it targets a specific microphone. You can also pass in
   * a full MediaTrackConstraints object to fine-tune behavior (e.g., noise suppression, echo cancellation).
   *
   * @param {string|MediaTrackConstraints|null} options - Either a deviceId string, a full constraints object, or null for defaults.
   * @returns {Promise<MediaStream>} A promise resolving to the active audio stream.
   */
  async startMicrophone(options = null) {
    let constraints;
    if (typeof options === 'string') {
      const valid = this.#devices.audio.some((d) => d.deviceId === options);
      if (!valid) throw new Error(`Invalid microphone deviceId: ${options}`);
      constraints = { audio: { deviceId: { exact: options } } };
    } else if (typeof options === 'object' && options !== null) {
      // @ts-ignore
      const id = options.deviceId?.exact;
      if (id && !this.#devices.audio.some((d) => d.deviceId === id))
        throw new Error(`Invalid microphone deviceId: ${id}`);
      constraints = { audio: options };
    } else {
      constraints = { audio: true };
    }

    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    this.micStream = stream;
    return stream;
  }

  /**
   * Starts capturing video from the webcam with flexible constraints.
   *
   * Accepts a deviceId string for a specific webcam, or a full MediaTrackConstraints
   * object to customize video input (resolution, frameRate, etc.).
   *
   * @param {string|MediaTrackConstraints|null} options - Either a deviceId string, a full constraints object, or null for defaults.
   * @returns {Promise<MediaStream>} A promise resolving to the active video stream.
   */
  async startWebcam(options = null) {
    let constraints;
    if (typeof options === 'string') {
      const valid = this.#devices.video.some((d) => d.deviceId === options);
      if (!valid) throw new Error(`Invalid webcam deviceId: ${options}`);
      constraints = { video: { deviceId: { exact: options } } };
    } else if (typeof options === 'object' && options !== null) {
      // @ts-ignore
      const id = options.deviceId?.exact;
      if (id && !this.#devices.video.some((d) => d.deviceId === id))
        throw new Error(`Invalid webcam deviceId: ${id}`);
      constraints = { video: options };
    } else {
      constraints = { video: true };
    }

    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    this.camStream = stream;
    return stream;
  }

  /**
   * Starts screen sharing with customizable audio and video constraints.
   *
   * You can pass a boolean to enable or disable audio,
   * or an object to define custom `audio` and `video` constraints.
   *
   * @param {boolean|MediaStreamConstraints} options - `true` = enable audio, `false` = no audio, or an object with audio/video constraints.
   * @returns {Promise<MediaStream>} A promise resolving to the active screen capture stream.
   */
  async startScreenShare(options = true) {
    let constraints;
    if (typeof options === 'boolean') {
      constraints = {
        video: true,
        audio: options,
      };
    } else if (typeof options === 'object' && options !== null) {
      constraints = {
        video: options.video ?? true,
        audio: options.audio ?? false,
      };
    } else throw new TypeError('Invalid screen share options.');
    const stream = await navigator.mediaDevices.getDisplayMedia(constraints);
    this.screenStream = stream;
    return stream;
  }

  /**
   * Sends a media stream over the socket using a MediaRecorder.
   *
   * This method starts recording the provided MediaStream using the specified MIME type and interval,
   * and emits the resulting data chunks through the socket under the provided label.
   *
   * The recording continues automatically in slices defined by the `timeslice` parameter.
   * Each chunk is emitted via `socket.emit()` only if it has data.
   *
   * @param {MediaStream} stream - The media stream to send. Must be a valid MediaStream instance.
   * @param {string} label - The socket channel label used to identify the stream (e.g., 'mic', 'cam', 'screen').
   * @param {Object} [options={}] - Optional settings for recording.
   * @param {string} [options.mimeType='video/webm;codecs=vp9,opus'] - The MIME type used by MediaRecorder.
   * @param {number} [options.timeslice=100] - The interval (in ms) for emitting recorded data chunks.
   *
   * @throws {TypeError} If the stream is not a valid MediaStream.
   * @throws {DOMException} If the MediaRecorder cannot be created with the given stream and options.
   */
  #sendStreamOverSocket(stream, label, options = {}) {
    const mime = options.mimeType || 'video/webm;codecs=vp9,opus';
    const timeslice = options.timeslice || 100;

    const recorder = new MediaRecorder(stream, { mimeType: mime });

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        this.socket.emit(label, e.data);
      }
    };

    recorder.start(timeslice);
  }

  /**
   * Sends the current microphone stream over the socket connection.
   *
   * This method retrieves the microphone stream using `getMicStream()` and transmits it
   * through the internal socket using a predefined channel label ('mic').
   *
   * @throws {Error} If the microphone stream is invalid or not available.
   */
  sendMicStreamOverSocket() {
    this.#sendStreamOverSocket(this.getMicStream(), 'mic');
  }

  /**
   * Sends the current webcam stream over the socket connection.
   *
   * This method retrieves the webcam stream using `getCamStream()` and transmits it
   * through the internal socket using a predefined channel label ('cam').
   *
   * @throws {Error} If the webcam stream is invalid or not available.
   */
  sendWebcamStreamOverSocket() {
    this.#sendStreamOverSocket(this.getCamStream(), 'cam');
  }

  /**
   * Sends the current screen sharing stream over the socket connection.
   *
   * This method retrieves the screen stream using `getScreenStream()` and transmits it
   * through the internal socket using a predefined channel label ('screen').
   *
   * @throws {Error} If the screen sharing stream is invalid or not available.
   */
  sendScreenStreamOverSocket() {
    this.#sendStreamOverSocket(this.getScreenStream(), 'screen');
  }

  /**
   * Stops the microphone stream if active.
   *
   * This method stops all tracks from the currently active microphone stream
   * and clears its reference to prevent reuse or memory leaks.
   */
  stopMicrophoneStream() {
    if (this.micStream) {
      this.micStream.getTracks().forEach((t) => t.stop());
      this.micStream = null;
    }
  }

  /**
   * Stops the webcam stream if active.
   *
   * This method stops all tracks from the currently active webcam stream
   * and clears its reference to prevent reuse or memory leaks.
   */
  stopWebcamStream() {
    if (this.camStream) {
      this.camStream.getTracks().forEach((t) => t.stop());
      this.camStream = null;
    }
  }

  /**
   * Stops the screen sharing stream if active.
   *
   * This method stops all tracks from the currently active screen stream
   * and clears its reference to prevent reuse or memory leaks.
   */
  stopScreenStream() {
    if (this.screenStream) {
      this.screenStream.getTracks().forEach((t) => t.stop());
      this.screenStream = null;
    }
  }

  /**
   * Stops all active media streams (microphone, webcam, and screen share).
   *
   * This method calls the individual stop methods to ensure each stream is safely terminated.
   * Use this when you want to stop all media input/output at once.
   */
  stopAllStreams() {
    this.stopMicrophoneStream();
    this.stopWebcamStream();
    this.stopScreenStream();
  }
}
