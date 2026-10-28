/**
 * Synchronous persistence contract implemented by browser Storage.
 * @interface SaveStorage
 */
export interface SaveStorage {
  /**
   * Returns item for SaveStorage.
   * @param {string} key Key identifying the associated input or resource.
   * @returns {string | null} item for SaveStorage.
   */
  getItem(key: string): string | null;
  /**
   * Updates item for SaveStorage.
   * @param {string} key Key identifying the associated input or resource.
   * @param {string} value Value to read, validate, format, or assign.
   * @returns {void}
   */
  setItem(key: string, value: string): void;
  /**
   * Removes item for SaveStorage.
   * @param {string} key Key identifying the associated input or resource.
   * @returns {void}
   */
  removeItem(key: string): void;
}
