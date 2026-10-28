/**
 * Versioned snapshot persisted by the shared save service.
 * @interface SavedGame
 */
export interface SavedGame<T> {
  /**
   * Schema version used to validate compatibility.
   * @property {number} version
   */
  version: number;
  /**
   * Timestamp recording when the snapshot was saved.
   * @property {string} savedAt
   */
  savedAt: string;
  /**
   * Snapshot payload persisted by the save service.
   * @property {T} data
   */
  data: T;
}
