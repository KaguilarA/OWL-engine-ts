/**
 * An outcome and its relative selection weight.
 * @interface WeightedEntry
 */
export interface WeightedEntry<T> {
  /**
   * Outcome selected from the table.
   * @property {T} value
   */
  readonly value: T;

  /**
   * Relative probability weight, which must be positive and finite.
   * @property {number} weight
   */
  readonly weight: number;
}
