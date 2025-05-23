# 🎥 TinyStreamManager — Docs & Build Overview

Welcome to the official documentation and structure reference for **TinyStreamManager** — a tiny, modular toolkit to manage audio/video streams in the browser! 📡🎙️

## 📂 File Overview

Here's a breakdown of the documentation files and their corresponding source logic:

| File Name              | Description 📘                                        |
| ---------------------- | ----------------------------------------------------- |
| `TinyMediaReceiver.md` | Full guide on the continuous media receiver 🎧        |
| `TinyStreamManager.md` | Main controller for managing stream receivers 🔁      |
| `Utils.md`             | Utility methods used across the project 🛠️           |
| `VolumeMeter.md`       | Visual and logical representation of volume input 🎚️ |

---

## 📦 Compiled Output

All JavaScript output files are located in:

```
/dist/client
```

This includes:

* [`TinyStreamManager.mjs`](./TinyStreamManager.md) ➜ **Main entry point** for stream management logic. 🚀
* [`TinyMediaReceiver.mjs`](./TinyMediaReceiver.md) ➜ Class that handles individual stream playback.
* [`VolumeMeter.mjs`](./VolumeMeter.md) ➜ Utility class to display and manage audio levels.
* `volume-processor.js` ➜ 💡 Custom Web Audio API `AudioWorkletProcessor` script.

---

## 🧠 About

This project is designed for performance, modularity, and extensibility. Whether you’re working on a WebRTC-based voice chat, remote media synchronization, or just want a nice tiny buffer-based stream receiver — this kit’s got you covered! ❤️
