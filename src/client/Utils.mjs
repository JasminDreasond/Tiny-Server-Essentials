/**
 * @param {number} volume
 * @returns {number}
 * @throws {Error} If input is not a number
 * @throws {RangeError} If input is NaN, not finite, or out of allowed range (0–100)
 */
export const micVolumeFilter = (volume) => {
  if (typeof volume !== 'number') throw new Error('Volume must be a number.');
  if (Number.isNaN(volume) || !Number.isFinite(volume))
    throw new RangeError('Volume must be a finite number.');
  if (volume < 0 || volume > 100) throw new RangeError('Volume must be between 0 and 100.');
  return volume / 100;
};
