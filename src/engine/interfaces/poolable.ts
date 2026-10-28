/**
 * Interface that must be implemented by objects managed by an ObjectPool.
 */
export interface Poolable {
  /**
   * Resets poolable for Poolable.
   * @returns {void}
   */
  reset(): void;
}