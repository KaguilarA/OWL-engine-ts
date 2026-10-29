import type { InputActionState } from '../interfaces';

/**
 * Immutable fallback for actions absent from the current input sample.
 * @constant
 * @type {InputActionState}
 */
const idleInputState: InputActionState = Object.freeze({ value: 0, down: false, pressed: false, released: false });

export default idleInputState;
