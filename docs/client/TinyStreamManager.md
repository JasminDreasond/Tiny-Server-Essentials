# 📡 TinyStreamManager

> **A flexible media stream manager for mic, camera, and screen capture with audio volume metering and socket emission support.** 🎤📷🖥️

---

## 🔍 Overview

`TinyStreamManager` is a class designed to handle various media input streams (microphone, camera, and screen) in browsers and Electron environments. It supports:

- Starting and managing media streams with flexible device constraints.
- Emitting streams to sockets or handlers with specific labels (`mic`, `cam`, `screen`).
- Measuring audio volume levels for microphone and screen audio.
- Advanced support for Electron-specific media capture constraints.
  
---

## ⚙️ Main Features

| Feature                         | Description                                       | Emoji        |
| -------------------------------|-------------------------------------------------|--------------|
| Manage media streams            | Start/stop mic, camera, and screen capture      | 🎙️📹🖥️        |
| Flexible constraints            | Use deviceId or full constraint objects          | 🔧           |
| Stream emission                | Emit streams via socket or event emitter          | 📡           |
| Volume metering                 | Measure audio volume on mic and screen audio     | 📊           |
| Electron support                | Use Electron-specific media capture options      | ⚡           |

---

## 🎯 Key Events Emitted

| Event Name    | Description                          | Payload Type  | Emoji  |
|---------------|------------------------------------|---------------|--------|
| `Mic`         | Microphone audio stream             | `MediaStream` | 🎤     |
| `MicMeter`    | Microphone audio volume level       | `number`      | 📈     |
| `Cam`         | Webcam video stream                 | `MediaStream` | 📷     |
| `Screen`      | Screen capture video stream         | `MediaStream` | 🖥️     |
| `ScreenMeter` | Screen audio volume level           | `number`      | 🎚️     |

---

## 🛠️ Internal Usage

- Uses **`navigator.mediaDevices.getUserMedia`** for microphone and camera.
- Uses **`navigator.mediaDevices.getDisplayMedia`** for screen sharing.
- Supports **Electron-specific** properties like `chromeMediaSource` for advanced screen capture.
- Handles multiple streams with `TinyMediaReceiver`.
- Manages asynchronous operations with `TinyPromiseQueue`.

---

## 📦 Dependencies

- [events](https://nodejs.org/api/events.html) — EventEmitter base class for event handling
- [tiny-essentials](https://www.npmjs.com/package/tiny-essentials) — For promise queue handling (`TinyPromiseQueue`)
- `VolumeMeter` — Custom audio volume level measurement module
- `TinyMediaReceiver` — Media stream receiver and buffer handler

---

## 🔔 Events

The `TinyStreamManager` class uses a predefined set of **event labels** for managing and monitoring media streams. These events are emitted internally or externally via socket communication or internal dispatching.

| Event Name        | Description                                                                             | Emoji |
| ----------------- | --------------------------------------------------------------------------------------- | ----- |
| `Destroyed`       | Emitted when the instance is destroyed. Useful to clean up resources or UI.             | 🗑️   |
| `ReceiverDeleted` | Emitted when a media receiver (e.g., WebSocket or PeerConnection) is removed or closed. | ❌     |
| `ReceiverAdded`   | Emitted when a new media receiver is added dynamically at runtime.                      | ➕     |
| `StartCam`        | Request to start the webcam stream.                                                     | 📷    |
| `StartMic`        | Request to start the microphone stream.                                                 | 🎤    |
| `StartScreen`     | Request to start the screen sharing stream.                                             | 🖥️   |
| `StopCam`         | Request to stop the webcam stream.                                                      | ✋📷   |
| `StopMic`         | Request to stop the microphone stream.                                                  | ✋🎤   |
| `StopScreen`      | Request to stop the screen sharing stream.                                              | ✋🖥️  |
| `Cam`             | Emitted when webcam stream is transmitted.                                              | 📹    |
| `Mic`             | Emitted when microphone stream is transmitted.                                          | 🎧    |
| `Screen`          | Emitted when screen sharing stream is transmitted.                                      | 🖥️   |
| `ScreenMeter`     | Periodic event emitting screen audio volume data.                                       | 🎚️   |
| `MicMeter`        | Periodic event emitting microphone audio volume data.                                   | 📊    |

---

## 🔍 Method: `existsEvent(name)`

Checks if a given event name exists in the internal `Events` map.

```js
existsEvent(name: string): boolean
```

### Parameters

* `name` — *string*: The event name to check.

### Returns

* `true` if the event name exists in `Events`.
* `false` otherwise.

### Example usage

```js
if (tinyStreamManager.existsEvent('Mic')) {
  console.log('Event exists!');
} else {
  console.log('No such event.');
}
```

---

## 🎛️ Properties and Configurations

### 🎧 Audio/Video Devices

```js
#devices = {
  audio: MediaDeviceInfo[],
  speaker: MediaDeviceInfo[],
  video: MediaDeviceInfo[],
}
```

* Holds the lists of available devices for audio input, speakers, and video input.

---

### 🔊 Volume Meters

| Property      | Type          |                                    |
| ------------- | ------------- | ---------------------------------- |
| `micMeter`    | \`VolumeMeter | Meter for microphone audio volume. |
| `screenMeter` | \`VolumeMeter | Meter for screen audio volume.     |

---

### 🎥 Media Streams

| Property       | Type          |                               |
| -------------- | ------------- | ----------------------------- |
| `micStream`    | \`MediaStream | Active microphone stream.     |
| `camStream`    | \`MediaStream | Active webcam stream.         |
| `screenStream` | \`MediaStream | Active screen sharing stream. |

---

### 🎙️ MediaRecorder Instances

```js
#recorders = new Map<string, MediaRecorder>();
```

* Holds MediaRecorder objects keyed by stream ID or name.

---

### ⏲️ Volume Monitoring Interval

| Property             | Type             | Description |                                                  |
| -------------------- | ---------------- | ----------- | ------------------------------------------------ |
| `#monitorIntervalId` | \`NodeJS.Timeout | null\`      | ID of the `setInterval` monitoring audio volume. |

---

## ▶️ Private Method: `#startMonitorInterval()`

Starts a `setInterval` loop to monitor audio volume meters (`micMeter` and `screenMeter`) and emit corresponding volume events.

* Emits events:

  * `'MicMeter'` with mic volume data.
  * `'ScreenMeter'` with screen volume data.
* Interval runs only if any meter is active.
* Volume percentage is normalized from `0` to `100`.

---

## ⏹️ Private Method: `#stopMonitorInterval()`

Stops and clears the active monitoring interval if no meters are active.

---

## ⚙️ Stream Configurations

| Stream     | Default Config                                                                      |
| ---------- | ----------------------------------------------------------------------------------- |
| **Mic**    | `{ mimeType: 'audio/webm', audioCodec: 'opus', timeslice: 100 }`                    |
| **Cam**    | `{ mimeType: 'video/webm', videoCodec: 'vp9', timeslice: 100 }`                     |
| **Screen** | `{ mimeType: 'video/webm', audioCodec: 'opus', videoCodec: 'vp9', timeslice: 500 }` |

* Timeslice is the interval in ms for emitting media data chunks.
* Screen timeslice is longer to accommodate typical frame rates (e.g., 500ms \~ 10 FPS).

---

## 🔄 Method: `updateMediaConfig(target, updates)`

Updates media streaming configuration for microphone, camera, or screen.

```js
updateMediaConfig(
  target: 'mic' | 'cam' | 'screen',
  updates: { mimeType?: string; timeslice?: number }
): void
```

### Parameters

* `target`: Which stream config to update (`'mic'`, `'cam'`, `'screen'`).
* `updates`: Object containing optional properties to update:

  * `mimeType`: New MIME type for MediaRecorder.
  * `timeslice`: New chunk interval in milliseconds.

### Throws

* Error if `target` is invalid.
* Error if `mimeType` is unsupported or invalid.
* Error if `timeslice` is not a positive finite number.

### Example

```js
tinyStreamManager.updateMediaConfig('mic', {
  mimeType: 'audio/webm; codecs=opus',
  timeslice: 200,
});
```

---

## 🎙️ Media Stream Getters

### `getMicStream()`

Returns the current **microphone stream** if valid.

* **Returns:** `MediaStream` — active mic stream.
* **Throws:** Error if the mic stream is not a valid `MediaStream`.

---

### `getCamStream()`

Returns the current **webcam stream** if valid.

* **Returns:** `MediaStream` — active webcam stream.
* **Throws:** Error if the webcam stream is not a valid `MediaStream`.

---

### `getScreenStream()`

Returns the current **screen sharing stream** if valid.

* **Returns:** `MediaStream` — active screen sharing stream.
* **Throws:** Error if the screen stream is not a valid `MediaStream`.

---

## 🔊 Volume Meter Getters

### `getMicMeter()`

Returns the current **microphone volume meter** if valid.

* **Returns:** `VolumeMeter` — active mic volume meter.
* **Throws:** Error if mic meter is not a valid `VolumeMeter`.

---

### `getScreenMeter()`

Returns the current **screen volume meter** if valid.

* **Returns:** `VolumeMeter` — active screen volume meter.
* **Throws:** Error if screen meter is not a valid `VolumeMeter`.

---

## ✅ Volume Meter Existence Checks

### `hasMicMeter()`

Checks if a valid microphone volume meter exists.

* **Returns:** `boolean` — `true` if micMeter exists and is valid, otherwise `false`.

---

### `hasScreenMeter()`

Checks if a valid screen volume meter exists.

* **Returns:** `boolean` — `true` if screenMeter exists and is valid, otherwise `false`.

---

## ⚙️ Constructor

### `constructor()`

Creates an instance of the media device manager.

* Initializes internal device lists and streams.
* Automatically calls `updateDeviceList()` on creation to load current devices.

---

## 📡 Device List Management

### `async updateDeviceList()`

Fetches and updates the list of available media devices from the system.

* Uses `navigator.mediaDevices.enumerateDevices()` to retrieve devices.
* Categorizes devices into:

  * `video` — video input devices (cameras).
  * `audio` — audio input devices (microphones).
  * `speaker` — audio output devices (speakers/headphones).
* Updates the internal `devices` state with these categories.
* Ensures only one update runs at a time via internal queue.
* If device info is not accessible, sets all device lists to empty arrays.

**Returns:**

* `Promise<{ video: MediaDeviceInfo[], audio: MediaDeviceInfo[], speaker: MediaDeviceInfo[] }>`

  * Resolves with the updated devices object.

---

## 🎛️ Device Retrieval

### `getDevicesByKind(kind)`

Retrieves devices filtered by the specified kind.

* **Parameters:**

  * `kind` (string): Must be one of `'audio'`, `'video'`, or `'speaker'`.
* **Returns:**

  * `MediaDeviceInfo[]` — array of devices matching the requested kind.
* **Throws:**

  * Error if manager is not initialized.
  * Error if `kind` is not a string.
  * `RangeError` if `kind` is not one of the accepted values.
  * Error if no devices found for the requested kind.

---

### `getAllDevices()`

Returns an array containing all available audio, video, and speaker devices.

* **Returns:**

  * `MediaDeviceInfo[]` — all devices concatenated in the order: speakers, audio inputs, video inputs.
* **Throws:**

  * Error if manager is not initialized.

---

### 🔴 `#stopSocketStream(label)`

Stops an active MediaRecorder associated with a specific socket label.

This method stops the recording process for the given label if a recorder exists,
and removes the recorder reference from the internal map to free up resources.

Use this to manually stop sending a stream over the socket.

* **Parameters:**

  * `label` (`StreamEventTypes`): The socket event label linked to the recorder (e.g., `'mic'`, `'cam'`, `'screen'`).

---

### 👀 `#stopDeviceDetector(stream, label)`

Internal helper that detects when media tracks end, and stops the corresponding socket stream.

* **Parameters:**

  * `stream` (`MediaStream`): The media stream being monitored.
  * `label` (`StreamEventTypes`): The socket label to stop when the stream ends.

---

### 🎤 `startMic(options = null, hearVoice = false)`

Starts capturing audio from the microphone with flexible constraints.

If a deviceId is provided, it targets a specific microphone. You can also pass a full MediaTrackConstraints object
to fine-tune features like noise suppression or echo cancellation.

**Behavior:**

* Emits the audio stream over the socket with label `"mic"`.

* Starts volume monitoring and emits microphone volume events with label `"micMeter"`.

* **Parameters:**

  * `options` (`string | MediaTrackConstraints | null`): Device ID, constraints object, or `null` for defaults.
  * `hearVoice` (`boolean`): Whether you want to hear your own microphone audio.

* **Returns:** `Promise<MediaStream>` — resolves with the active audio stream.

* **Throws:**

  * If deviceId is invalid.
  * If no audio track is found in the stream.

---

### 📷 `startCam(options = null)`

Starts capturing video from the webcam with flexible constraints.

Accepts a deviceId string or a full MediaTrackConstraints object to customize input (resolution, frame rate, etc).

**Behavior:**

* Emits the video stream over the socket under the label `"cam"`.

* **Parameters:**

  * `options` (`string | MediaTrackConstraints | null`): Device ID, constraints object, or `null` for defaults.

* **Returns:** `Promise<MediaStream>` — resolves with the active video stream.

* **Throws:**

  * If deviceId is invalid.

---

### 🖥️ `startScreen(options = true, hearScreen = false)`

Starts screen sharing with customizable audio and video constraints.

You can pass:

* `true` to enable audio,
* `false` to disable audio,
* or an object to specify detailed audio/video constraints.

**Behavior:**

* Emits the screen stream over the socket under the label `"screen"`.
* If audio is present, starts volume monitoring under label `"screenMeter"`.

> **Warning:** If `hearScreen` is `true`, your ears might suffer! 🎧🔥

* **Parameters:**

  * `options` (`boolean | ScreenShareConstraints`): Audio enabled or constraints object.
  * `hearScreen` (`boolean`): Whether to hear the screen audio.
* **Returns:** `Promise<MediaStream>` — resolves with the active screen capture stream.
* **Throws:**

  * If options are invalid.

---

### 🔄 `#sendStreamOverSocket(stream, allowCodecs, label, options)`

Sends a media stream over the socket using a `MediaRecorder`.

Starts recording the stream with given MIME type and timeslice,
then emits data chunks over the socket labeled by `label`.

Won't start a new recorder if one is already running for the label.

* **Parameters:**

  * `stream` (`MediaStream`): The media stream to send.
  * `allowCodecs` (`{ audio: boolean; video: boolean }`): Which codecs to allow.
  * `label` (`StreamEventTypes`): Socket label (e.g., `'mic'`, `'cam'`, `'screen'`).
  * `options` (`StreamConfig`): Recording options (mimeType, codecs, timeslice, etc).
* **Throws:**

  * If `label` is not string.
  * If `stream` is invalid.
  * If recorder for label already exists.
  * If MIME type unsupported.
  * If timeslice invalid.
  * If MediaRecorder creation fails.

---

### ✋ `stopMic()`

Stops the microphone stream if active.

Stops all tracks and clears references.

* **Throws:**

  * If no active microphone stream.

---

### ✋ `stopCam()`

Stops the webcam stream if active.

Stops all tracks and clears references.

* **Throws:**

  * If no active webcam stream.

---

### ✋ `stopScreen()`

Stops the screen sharing stream if active.

Stops all tracks and clears references.

* **Throws:**

  * If no active screen sharing stream.

---

### 🛑 `stopAll()`

Stops all active media streams (mic, cam, screen).

Calls the individual stop methods safely.

Use this to cut all media inputs at once.

---

### 📛 `getMediaId(userId, type, mime, element)`

Generates a unique media identifier string based on the given parameters.

| Parameter | Type           | Description                                                                        |
| --------- | -------------- | ---------------------------------------------------------------------------------- |
| `userId`  | `string`       | The ID of the user.                                                                |
| `type`    | `string`       | The type/category of the media (`mic`, `cam`, `screen`).                           |
| `mime`    | `string`       | The MIME type of the media.                                                        |
| `element` | `ReceiverTags` | The media element tag name or an `HTMLMediaElement` instance (`audio` or `video`). |

**Returns:** `string` — A concatenated string uniquely identifying the media.

---

### 🔍 `hasReceiver(userId, type, mime, element)`

Checks if a media receiver exists for the given stream parameters.

| Parameter | Type           | Description                                      |
| --------- | -------------- | ------------------------------------------------ |
| `userId`  | `string`       | The user ID to attach the stream.                |
| `type`    | `string`       | The stream type, e.g., `'mic'`.                  |
| `mime`    | `string`       | The MIME type, e.g., `'audio/webm;codecs=opus'`. |
| `element` | `ReceiverTags` | The media element tag name (`audio` or `video`). |

**Returns:** `boolean` — `true` if the receiver exists, otherwise `false`.

---

### ❌ `deleteReceiver(userId, type, mime, element)`

Deletes a media receiver and releases its resources.

| Parameter | Type           | Description                                      |
| --------- | -------------- | ------------------------------------------------ |
| `userId`  | `string`       | The user ID attached to the stream.              |
| `type`    | `string`       | The stream type, e.g., `'mic'`.                  |
| `mime`    | `string`       | The MIME type, e.g., `'audio/webm;codecs=opus'`. |
| `element` | `ReceiverTags` | The media element tag name (`audio` or `video`). |

**Throws:** `Error` if no media receiver exists for the given parameters.

---

### 🎧 `getReceiver(userId, type, mime, element)`

Retrieves an existing media receiver for continuous streaming.

| Parameter | Type           | Description                                      |
| --------- | -------------- | ------------------------------------------------ |
| `userId`  | `string`       | The user ID attached to the stream.              |
| `type`    | `string`       | The stream type, e.g., `'mic'`.                  |
| `mime`    | `string`       | The MIME type, e.g., `'audio/webm;codecs=opus'`. |
| `element` | `ReceiverTags` | The media element tag name (`audio` or `video`). |

**Returns:** `TinyMediaReceiver` — The existing receiver instance.

**Throws:** `Error` if no media receiver exists for the given parameters.

---

### 🚀 `initReceiver(userId, type, mimeType, element, options)`

Initializes a new media receiver or returns an existing one for streaming media chunks.

| Parameter                 | Type           | Description                                                          |
| ------------------------- | -------------- | -------------------------------------------------------------------- |
| `userId`                  | `string`       | The user ID attached to the stream.                                  |
| `type`                    | `StreamTypes`  | The stream type, e.g., `'mic'`.                                      |
| `mimeType`                | `string`       | The MIME type, e.g., `'audio/webm;codecs=opus'`.                     |
| `element`                 | `ReceiverTags` | The media element tag name (`audio` or `video`).                     |
| `options`                 | `Object`       | Optional configuration object.                                       |
| `options.maxBufferBack`   | `number`       | Maximum seconds of buffered media behind current time (default: 10). |
| `options.cleanupTime`     | `number`       | Interval in milliseconds for buffer cleanup (default: 100).          |
| `options.bufferTolerance` | `number`       | Tolerance in seconds when comparing buffer ranges (default: 0.1).    |

**Returns:** `TinyMediaReceiver` — The new or existing receiver instance.

---

### 🧹 `destroy()`

Destroys the instance by terminating all active streams, stopping processes, and removing all event listeners.

* Calls `destroy()` on all media receivers to free resources.
* Clears the internal streams map.
* Stops all ongoing operations.
* Removes all event listeners to prevent memory leaks.

**Use this method to completely clean up the instance when no longer needed.**

**Returns:** `void`
