/**
 * Explicit outcome so storage failures do not interrupt gameplay.
 * @typedef {SaveResult<T>} SaveResult
 */
type SaveResult<T> = {
/**
 * Ok configuration or state owned by SaveResult.
 * @property {true} ok
 */
ok: true;
/**
 * Value to read, validate, format, or assign.
 * @property {T} value
 */
value: T } | {
  /**
   * Ok configuration or state owned by SaveResult.
   * @property {false} ok
   */
  ok: false;
  /**
   * Reason configuration or state owned by SaveResult.
   * @property {"missing" | "unavailable" | "invalid" | "version"} reason
   */
  reason: 'missing' | 'unavailable' | 'invalid' | 'version';
};

export type { SaveResult as default };
