/**
 * Snapshot sampled once per frame, shared by every consumer of an action.
 * @interface InputActionState
 */
export interface InputActionState {
  /**
   * Value to read, validate, format, or assign.
   * @property {number} value
   * @readonly
   */
  readonly value: number;
  /**
   * Down configuration or state owned by InputActionState.
   * @property {boolean} down
   * @readonly
   */
  readonly down: boolean;
  /**
   * Pressed configuration or state owned by InputActionState.
   * @property {boolean} pressed
   * @readonly
   */
  readonly pressed: boolean;
  /**
   * Released configuration or state owned by InputActionState.
   * @property {boolean} released
   * @readonly
   */
  readonly released: boolean;
}
