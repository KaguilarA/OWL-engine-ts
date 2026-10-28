/**
 * Minimal standard-mapped gamepad contract; also permits deterministic tests.
 * @interface InputGamepad
 */
export interface InputGamepad {
  /**
   * Connected configuration or state owned by InputGamepad.
   * @property {boolean} connected
   * @readonly
   */
  readonly connected: boolean;
  /**
   * Mapping configuration or state owned by InputGamepad.
   * @property {string} mapping
   * @readonly
   */
  readonly mapping: string;
  /**
   * Axes configuration or state owned by InputGamepad.
   * @property {readonly number[]} axes
   * @readonly
   */
  readonly axes: readonly number[];
  /**
   * Buttons configuration or state owned by InputGamepad.
   * @property {readonly { readonly value: number; readonly pressed: boolean; }[]} buttons
   * @readonly
   */
  readonly buttons: readonly { 
  /**
   * Value to read, validate, format, or assign.
   * @property {number} value
   * @readonly
   */
  readonly value: number; 
  /**
   * Pressed configuration or state owned by InputGamepad.
   * @property {boolean} pressed
   * @readonly
   */
  readonly pressed: boolean }[];
}
