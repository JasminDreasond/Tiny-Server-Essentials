# 💡 Tiny Toolkit – Docs Overview

Welcome to the **Tiny Toolkit** documentation!
This suite is built with love to simplify complex server-side interactions, whether you're managing IPs, domains, WebSocket logic, or browser-side audio input 💻🎤

Each document in this repository focuses on a specific module of the toolkit.

---

## 📚 Documentation Menu

Here's your guide to everything:

| 📄 Document                      | 🔍 Description                                                                                                  |
| -------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| [**Express**](./Express.md)   | Explains the `TinyExpress` enhancements and useful types related to HTTP/Express request handling.    |
| [**Instance**](./Instance.md) | Learn about `TinyWebInstance`, a secure server wrapper that manages domains and server validation.              |
| [**Io**](./Io.md)             | Covers the `TinyIo` module, focused on managing WebSocket identity, security, origin checks, and IP extraction. |
| [**Utils**](./Utils.md)       | Utility functions like `extractIpList` and `micVolumeFilter` that support various parts of the stack.           |

---

## ✨ About This Toolkit

All modules were carefully designed to be:

* 🔒 **Secure by default**
* 🧩 **Modular and reusable**
* 🧠 **Easy to extend**

Whether you're working with HTTP servers, WebSocket streams, or IP validation, these helpers will keep your codebase clean and maintainable.

---

## 🛠️ Requirements

* Node.js 18+
* Express (for types, not mandatory usage)
* socket.io (for `TinyIo`)

---

## 🖥️ Looking for Client-Side Docs?

If you're working on the **client-side** and want to explore UI filters, browser-related utilities, or anything related to user interactions...

👉 **Check out [`client`](./client)**

There you'll find:

* 🎙️ **Audio filters** like `micVolumeFilter`
* 🎛️ UI helpers and input sanitizers
* 📦 Components meant to be used directly in frontend logic

Everything in that folder complements the server-side modules and is optimized for lightweight, browser-safe use.
