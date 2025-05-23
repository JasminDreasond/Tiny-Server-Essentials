# 🎧 TinyMediaReceiver

> A lightweight utility for managing continuous audio/video stream buffering using `MediaSource`.  
> Ideal for real-time streaming apps, screen-sharing tools, and audio broadcasting via WebRTC or similar protocols.

---

## 🧩 Features

* 🌀 Continuous streaming via `MediaSource`
* 🧠 Smart buffer management and auto-cleanup
* 🕒 Playback synchronization
* 🎯 MIME type validation
* 🔁 Support for dynamic push of media chunks
* 🎧 Works with both `<audio>` and `<video>` tags

---

## 🛠️ Constructor

```js
new TinyMediaReceiver({
  element: 'audio', // or 'video' or an HTMLMediaElement
  mimeType: 'audio/webm;codecs=opus',
  maxBufferBack: 10,         // ⏪ Seconds to keep behind current time
  cleanupTime: 100,          // ⏱ Interval for cleaning buffer (ms)
  bufferTolerance: 0.1       // ⚖️ Margin to avoid desync issues
});
```

---

## 📦 Constructor Options

| Option            | Type                           | Required | Description                                                  |
| ----------------- | ------------------------------ | -------- | ------------------------------------------------------------ |
| `element`         | `string` or `HTMLMediaElement` | ✅        | Target media element or its tag name (`"audio"` / `"video"`) |
| `mimeType`        | `string`                       | ✅        | MIME type of the stream (e.g., `audio/webm;codecs=opus`)     |
| `bufferSize`      | `number`                       | ❌        | Max buffer length in seconds (default depends on media type) |
| `cleanupInterval` | `number`                       | ❌        | Time in ms to check for buffer cleaning                      |
| `tolerance`       | `number`                       | ❌        | Extra seconds to keep after current playback time            |

---

## 📡 Events

TinyMediaReceiver emits several events for lifecycle tracking and debugging.

| Event Name      | Description                                                             |
| --------------- | ----------------------------------------------------------------------- |
| `BufferCleaned` | 🧼 Emitted after cleaning old segments from the buffer.                 |
| `SyncTime`      | 🕒 Used to align time (multi-stream support or drift correction).       |
| `Destroyed`     | 💥 Emitted when the instance is destroyed.                              |
| `Error`         | ❌ Triggered if any error occurs during streaming.                       |
| `SourceOpen`    | 🔓 Fired when `MediaSource` is open and ready to accept `SourceBuffer`. |
| `FeedQueue`     | 🍔 Emitted whenever new data is queued into the `SourceBuffer`.         |

Use `.addEventListener()` on the instance to listen to these events:

```js
receiver.addEventListener('BufferCleaned', () => {
  console.log('Buffer was successfully cleaned!');
});
```
---

## 🔍 Method: `existsEvent(name)`

Checks if a given event name exists in the internal `Events` map.

```js
existsEvent(name: string): boolean
```

---

## ⚙️ Core Methods

### `push(buffer: ArrayBuffer)`

Push a new chunk of audio/video data into the playback buffer.

### `pushChunk(buffer: ArrayBuffer)`

Alias for `push`.

### `destroy()`

Gracefully ends the stream and frees resources, stopping intervals and revoking media URLs.

---

## 🎯 Getters & Setters

### `getElement(): HTMLMediaElement`

Returns the internal `<audio>` or `<video>` element.

### `getMaxBufferBack(): number`

Gets the max seconds of buffered media behind current time.

### `setMaxBufferBack(value: number)`

Sets how much data (in seconds) should be kept behind current time.

### `getTolerance(): number`

Returns the current desync tolerance in seconds.

### `setTolerance(value: number)`

Sets the buffer desync tolerance.

---

## 🧪 Example

```js
const receiver = new TinyMediaReceiver({
  element: 'audio',
  mimeType: 'audio/webm;codecs=opus',
});

receiver.push(someChunk);

// Later
receiver.destroy();
```

---

## 📌 Notes

* The internal `SourceBuffer` uses `'sequence'` mode to preserve chunk order.
* Automatically syncs `currentTime` if playback goes outside buffered range.
* Requires a modern browser that supports the MediaSource API.
