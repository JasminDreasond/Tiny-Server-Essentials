# 🎙️ VolumeMeter & micVolumeFilter

Utilities for real-time audio level analysis using the Web Audio API. Perfect for microphone input visualization, silence detection, and user-level monitoring.

---

## 🔊 `VolumeMeter` Class

A utility class that connects to a media stream (e.g., microphone or screen audio), uses a custom `AudioWorkletProcessor` (`volume-processor`), and calculates the real-time audio level for dynamic visualizations or monitoring.

### 🎯 Use Cases

* 🎛️ Audio visual meters
* 🔇 Silence detection
* 🖥️ Monitoring audio from screen capture or mic
* 🎧 Optional playback during monitoring

---

## 🛠️ Constructor

```js
const meter = new VolumeMeter();
```

---

## 🧰 Methods

### `setModulePath(path: string): void`

Changes the path for the `volume-processor` module script.

| Parameter | Type   | Description                     |
| --------- | ------ | ------------------------------- |
| path      | string | New file path for the processor |

---

### `connectToSource(stream: MediaStream, hearVoice = true): Promise<void>`

Connects to a `MediaStream`, hooks into its audio track, and begins volume tracking.

| Parameter | Type        | Description                               |
| --------- | ----------- | ----------------------------------------- |
| stream    | MediaStream | The media stream (e.g., microphone input) |
| hearVoice | boolean     | Whether to route audio to the output      |

Throws if the stream does not contain audio.

---

### `setVolume(value: number | string): void`

Sets the gain node value (volume) for the audio output, using `micVolumeFilter` internally.

---

### `stop(): Promise<boolean>`

Stops the audio stream, disconnects all nodes, and releases resources.

Resolves to `true` when cleanup completes successfully.

---

## 🎯 Private Method

### `#disconnect(): void`

Disconnects all internal audio nodes safely.

Throws if any of the nodes are not properly initialized.

---

## 📦 Properties

| Name      | Type         | Description                                                 |
| --------- | ------------ | ----------------------------------------------------------- |
| `context` | AudioContext | The internal audio context                                  |
| `volume`  | number       | Current real-time volume level (updated live via processor) |

---

## 🔁 VolumeProcessor Integration

You must provide an `AudioWorkletProcessor` script named `'volume-processor'` at the given module path (default: `/js/volume-processor.js`).

Example implementation expected in processor:

```js
registerProcessor('volume-processor', class extends AudioWorkletProcessor {
  process(inputs) {
    const input = inputs[0][0];
    const rms = Math.sqrt(input.reduce((acc, val) => acc + val * val, 0) / input.length);
    this.port.postMessage(rms);
    return true;
  }
});
```

---

## 📌 Notes

* Automatically disconnects when the media stream ends
* Gracefully handles missing or invalid audio streams
* Uses `AudioWorkletNode` to maintain high-accuracy metering
* `hearVoice` is `true` by default and allows loopback monitoring

