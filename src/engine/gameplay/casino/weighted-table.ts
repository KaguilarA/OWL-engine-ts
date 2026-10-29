import type { WeightedEntry } from '../../interfaces';

/**
 * Selects weighted outcomes for loot, casino reels, and randomized encounters.
 * @class WeightedTable
 */
export default class<T> {
  /**
   * Immutable weighted outcome entries.
   * @property {readonly WeightedEntry<T>[]} entries
   * @private
   * @readonly
   */
  private readonly entries: readonly WeightedEntry<T>[];

  /**
   * Random value source in the range from zero to one.
   * @property {() => number} random
   * @private
   * @readonly
   */
  private readonly random: () => number;

  /**
   * Creates a weighted table with a configurable random source.
   * @param entries Outcomes and their positive weights.
   * @param random Random value source.
   * @public
   * @return {void}
   * @constructor
   */
  public constructor(entries: readonly WeightedEntry<T>[], random: () => number = Math.random) {
    if (entries.length === 0 || entries.some((entry) => !Number.isFinite(entry.weight) || entry.weight <= 0)) {
      throw new RangeError('Weighted tables require outcomes with positive finite weights.');
    }
    this.entries = entries.map((entry) => ({ ...entry }));
    const totalWeight = this.entries.reduce((total, entry) => total + entry.weight, 0);
    if (!Number.isFinite(totalWeight)) throw new RangeError('Weighted table total weight must be finite.');
    this.random = random;
  }

  /**
   * Draws one outcome according to its weight relative to the other entries.
   * @public
   * @return {T}
   */
  public draw(): T {
    const value = this.random();
    if (!Number.isFinite(value) || value < 0 || value >= 1) {
      throw new RangeError('Weighted table random source must return values in the range [0, 1).');
    }
    const totalWeight = this.entries.reduce((total, entry) => total + entry.weight, 0);
    let threshold = value * totalWeight;
    for (const entry of this.entries) {
      threshold -= entry.weight;
      if (threshold < 0) return entry.value;
    }
    return this.entries[this.entries.length - 1].value;
  }
}
