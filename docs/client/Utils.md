## 📐 `micVolumeFilter(volume: number): number`

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
