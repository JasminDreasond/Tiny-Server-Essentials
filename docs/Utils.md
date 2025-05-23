# 🛠️ `Utils` – Utility Helpers for WebSocket and Audio Logic

A small collection of stateless, reusable utility functions used throughout the project — mostly for IP parsing and client-side audio handling.

---

## 🧪 `extractIpList(userIp)` – Smart IP Extractor

Normalizes and extracts a list of clean, unique IP addresses.

### ✅ Supported Inputs:

* `string` — a single IP (or multiple IPs comma-separated)
* `string[]` — array of IPs
* `null` or `undefined` — returns an empty list

### 🧠 It handles:

* IPv4: `192.168.1.1`
* IPv6: `::1`, `2001:0db8::ff00:42:8329`
* IPv4-mapped IPv6: `::ffff:192.168.1.1`

### 🧹 Cleans:

* Brackets (`[::1]`)
* `::ffff:` prefix
* Duplicate entries

### ✨ Example:

```js
extractIpList('::ffff:192.168.1.1, ::1, 10.0.0.2');
// → ['192.168.1.1', '::1', '10.0.0.2']
```

Returns only valid IPs after normalization.

---

## 🔊 `micVolumeFilter(volume: number): number`

Safely filters a raw volume input, ensuring it's a number within the acceptable range (0–100), and returns it normalized to a 0–1 scale.

### 🧪 Parameters

| Name   | Type   | Description             |
| ------ | ------ | ----------------------- |
| volume | number | Volume level (0 to 100) |

### 🔄 Returns

* `number` — Normalized volume (from `0.0` to `1.0`)

### ⚠️ Throws

* `Error` if input is not a number
* `RangeError` if input is `NaN`, not finite, or outside the 0–100 range

### ✅ Example

```js
const normalized = micVolumeFilter(75); // 0.75
```
