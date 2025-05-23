# 📡 Socket.IO Types & Origin Data

This section defines essential type aliases and data structures used in Socket.IO communication and HTTP origin handling.

---

### 📌 `Socket`

`@typedef {import('socket.io').Socket} Socket`
The Socket.IO socket instance representing a connected client.

---

### 📌 `HttpStatusCode`

`@typedef {number} HttpStatusCode`
A numeric HTTP status code (e.g., 200, 404, 500).

---

### 📌 `IPExtractor`

`@typedef {(socket: Socket) => string[]} IPExtractor`
Function type that extracts one or more IP addresses from a given Socket.IO socket.

---

### 📌 `DomainValidator`

`@typedef {(socket: Socket) => boolean} DomainValidator`
Function type that validates if the socket's domain is allowed. Returns `true` if valid.

---

### 📌 `OriginData`

`@typedef {Object} OriginData`
Represents structured data parsed from the HTTP `Origin` header.

| Property   | Type             | Description                                               |
| ---------- | ---------------- | --------------------------------------------------------- |
| `raw`      | `string \| null` | The raw, unprocessed `Origin` header value.               |
| `protocol` | `string`         | Protocol scheme (e.g., `"http"`, `"https"`).              |
| `hostname` | `string`         | Hostname extracted from the origin.                       |
| `port`     | `string`         | Port number, explicit or default based on protocol.       |
| `full`     | `string`         | Fully reconstructed origin URL from the components.       |
| `error`    | `string`         | Parsing error message, if any occurred during extraction. |

---

### 🔒 Private Properties

| Property                  | Type                                 | Description                                                               |
| ------------------------- | ------------------------------------ | ------------------------------------------------------------------------- |
| `#server`                 | `HttpServer`                         | The underlying HTTP or HTTPS server instance (private).                   |
| `#domainTypeChecker`      | `string`                             | Which request property to check domains against. Default: `'headerHost'`. |
| `#forbiddenDomainMessage` | `string`                             | Message sent to clients when domain validation fails.                     |
| `#ipExtractors`           | `{ [key: string]: IPExtractor }`     | Map of IP extraction functions keyed by extractor name.                   |
| `#activeExtractor`        | `string`                             | Current active IP extractor name (default `'DEFAULT'`).                   |
| `#domainValidators`       | `{ [key: string]: DomainValidator }` | Collection of domain validation callbacks by request property name.       |

---

### 🛠 Constructor

```js
constructor(server, options)
```

Creates a new Socket.IO wrapper instance.

* `server` can be:

  * An HTTP/HTTPS server instance,
  * A port number,
  * Or Socket.IO options object.
* `options` are Socket.IO server configuration options.

**Throws errors** if:

* `server` is not valid,
* `options` is not a non-null plain object.

**Features:**

* Automatically creates a default HTTP server if none is provided.
* Registers a connection handler that validates domains before accepting clients.
* Emits `"force_disconnect"` event and disconnects sockets on invalid domains.

---

### ⚙️ `init(web)`

```js
init(web = new TinyWebInstance(this.#getServer()))
```

Initializes the instance with a TinyWeb server wrapper.

* Adds localhost domains by default.
* Registers default domain validators:

  * `'x-forwarded-host'` header,
  * `'host'` header.
* Registers default IP extractors:

  * `ip`, `x-forwarded-for`, `remoteAddress`, `fastly-client-ip`.

**Throws error** if the argument is not a `TinyWebInstance`.

---

### 🔍 `getOrigin(socket)`

```js
getOrigin(socket)
```

Parses the `Origin` header from a Socket.IO handshake and returns a detailed structured object.

* Returns an `OriginData` object:

  * `raw`: raw header string or `null`,
  * `protocol`, `hostname`, `port`, `full`: parsed URL components,
  * `error`: if parsing failed.

---

### 🕸 `getWeb()`

Returns the current TinyWeb instance.

Throws error if `this.web` is not a valid `TinyWebInstance`.

---

### 🌐 `getServer()`

Returns the underlying HTTP/HTTPS server instance.

Uses the `TinyWeb` instance to get it.

---

### 🔗 `getRoot()`

Returns the active Socket.IO server instance.

---

### ➕ `addIpExtractor(key, callback)`

Registers a new IP extractor under a given key name.
The key `"DEFAULT"` is **reserved** and cannot be used directly.

* **Parameters:**

  * `key` *(string)* – A unique name for the extractor.
  * `callback` *(IPExtractor)* – A function receiving a `Socket` and returning a string or `null`.

* **Throws:**

  * `Error` if the key is `"DEFAULT"`, already exists, or is not a string.
  * `Error` if the callback is not a valid function.

🛠️ Example:

```js
manager.addIpExtractor("proxy-header", socket => extractIpList(socket.handshake.headers['x-real-ip']));
```

---

### ➖ `removeIpExtractor(key)`

Removes an existing IP extractor by its key.
You **cannot** remove the extractor currently in use unless the active extractor is `"DEFAULT"`.

* **Parameters:**

  * `key` *(string)* – The name of the extractor to remove.

* **Throws:**

  * `Error` if the key is invalid or the extractor is currently active.

⚠️ Ensure you switch away from the extractor before removal!

---

### 📦 `getIpExtractors()`

Returns a shallow copy of all registered IP extractors.

* **Returns:**

  * `Object<string, IPExtractor>` – A map of all current extractors.

🔍 Perfect for debugging or listing available strategies.

---

### 🎛️ `setActiveIpExtractor(key)`

Sets which IP extractor should be actively used.

* **Parameters:**

  * `key` *(string)* – The key of the extractor, or `"DEFAULT"` to fallback to standard logic.

* **Throws:**

  * `Error` if the key does not exist and is not `"DEFAULT"`.

🚦 Use this to switch IP strategies on-the-fly!

---

### 🎯 `getActiveExtractor()`

Retrieves the currently active extractor function.

* **Returns:**

  * `IPExtractor` – The function used to extract the IP.

✨ If `"DEFAULT"` is set, it falls back to standard header-based extraction logic.

---

### 🧪 `extractIp(socket)`

Executes the currently active extractor function and returns the result.

* **Parameters:**

  * `socket` *(Socket)* – The incoming connection.

* **Returns:**

  * `string[]` – A list of extracted IP addresses (may include fallback logic for deduplication).

🧰 This is the method you’ll call in your app to get the visitor’s IP reliably!

---

### ➕ `addDomainValidator(key, callback)`

Registers a new domain validator function under a unique key.
The key `"ALL"` is **reserved** and cannot be used.

* **Parameters:**

  * `key` *(string)*: A unique identifier for the validator.
  * `callback` *(DomainValidator)*: A function that takes a `Request` and returns a boolean.

* **Throws:**

  * `Error` if the key is `"ALL"`, already exists, or is invalid.
  * `Error` if the callback is not a function.

🛠️ Example usage:

```js
manager.addDomainValidator("host", (socket) => typeof socket.handshake.headers.host === 'string'
        ? this.web.canDomain(socket.handshake.headers.host)
        : false);
```

---

### ➖ `removeDomainValidator(key)`

Removes a domain validator, unless it's the one currently in use by the checker.

* **Parameters:**

  * `key` *(string)*: The validator key to remove.

* **Throws:**

  * `Error` if the key is not a string, not found, or is currently in use.

⚠️ Cannot remove a validator while it's actively being used (unless the checker is set to `"ALL"`).

---

### 📦 `getDomainValidators()`

Returns a shallow copy of all registered domain validators.

* **Returns:**

  * `Object<string, DomainValidator>`: An object containing all registered validators.

🔍 Great for debugging or displaying current configuration!

---

### 🧩 `setDomainTypeChecker(key)`

Sets which validator should be used to check incoming domains.

* **Parameters:**

  * `key` *(string)*: Must be an existing validator key or `"ALL"` for enabling all.

* **Throws:**

  * `Error` if the key is not valid or not registered.

⚠️ Use `"ALL"` cautiously as it enables **all validators at once**.
