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
