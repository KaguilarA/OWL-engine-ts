import type { InputBinding } from './';

/**
 * Maps semantic action names to their physical keyboard and gamepad controls.
 * @typedef {object} InputBindings
 */
type InputBindings = Record<string, InputBinding>;

export type { InputBindings as default };
