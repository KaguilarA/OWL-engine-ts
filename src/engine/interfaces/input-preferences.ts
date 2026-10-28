import type { InputBindings } from './';

/**
 * Stores per-context action overrides independently from the default bindings.
 * @typedef {object} InputPreferences
 */
type InputPreferences = Record<string, InputBindings>;

export type { InputPreferences as default };
