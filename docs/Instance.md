# 📦 `TinyWebInstance` – Web Server with Boundaries

`TinyWebInstance` is a strict wrapper around a Node.js HTTP or HTTPS server. It provides a clean API to manage server instances while maintaining a trusted list of domains for validation, routing, or filtering purposes.

---

## 🧠 Overview

`TinyWebInstance` ensures you're working only with proper HTTP or HTTPS servers from Node.js core — nothing more, nothing less. It's ideal when you want to bind server behavior to specific domains without accidentally leaking server internals or misusing instances.

---

## 🚀 Initialization

```js
import http from 'http';
import TinyWebInstance from './TinyWebInstance.js';

const server = http.createServer(/* handler */);
const instance = new TinyWebInstance(server);
```

### 🔐 Strict Type Checking

The constructor only accepts instances of:

* `http.Server`
* `https.Server`

Anything else will throw an error faster than a 502 on a broken proxy. 🧱

---

## 🔧 Methods

### `getServer()` 🖧

Returns the active `http.Server` or `https.Server`.

```js
const server = instance.getServer();
```

Throws an error if the internal server is somehow invalid (defensive check).

---

### `addDomain(domain: string)` ➕

Registers a new domain.

```js
instance.addDomain('example.com');
```

* Must be a string.
* Cannot add duplicates.

---

### `removeDomain(domain: string)` ➖

Unregisters an existing domain.

```js
instance.removeDomain('example.com');
```

* Throws if the domain isn't found.
* Throws if the domain isn't a string.

---

### `getDomains(): string[]` 📃

Returns a **shallow clone** of all registered domains.

```js
const domains = instance.getDomains();
```

This prevents accidental mutation of internal state — no side-effects here!

---

### `stripPort(host: string): string` ✂️

Removes any port from the host string, supporting:

* IPv4: `192.168.1.1:3000 → 192.168.1.1`
* IPv6: `[2001:db8::1]:443 → [2001:db8::1]`
* Hostnames: `example.com:8080 → example.com`

```js
const clean = instance.stripPort('example.com:8080');
```

---

### `hasDomain(host: string): boolean` 🔍

Checks if the given host (with or without port) matches any registered domain.

```js
instance.hasDomain('example.com:443'); // true
```

Internally uses `stripPort()` to normalize the comparison.
