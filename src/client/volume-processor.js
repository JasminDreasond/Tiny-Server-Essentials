/**
 * VolumeProcessor is an AudioWorkletProcessor that calculates the root mean square (RMS)
 * volume level from incoming audio samples in real-time.
 *
 * It listens to the input audio stream and computes the volume on each processing frame,
 * then posts the calculated volume value back to the main thread via the processor port.
 *
 * This processor can be used for volume visualization, metering, or detecting silence/activity in an audio stream.
 *
 * Registered under the name: 'volume-processor'.
 *
 * @class
 * @beta
 */
// @ts-ignore
class VolumeProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this._volume = 0;
  }

  /**
   * @param {*} inputs
   * @returns {boolean}
   */
  process(inputs) {
    const input = inputs[0][0];
    if (input) {
      let sum = 0;
      for (let i = 0; i < input.length; ++i) {
        sum += input[i] * input[i];
      }
      const volume = Math.sqrt(sum / input.length);
      // @ts-ignore
      this.port.postMessage(volume);
    }
    return true;
  }
}

// @ts-ignore
registerProcessor('volume-processor', VolumeProcessor);
