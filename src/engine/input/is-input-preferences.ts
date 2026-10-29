import type { InputPreferences } from '../interfaces';
import { isInputBindings } from './';

/**
 * Checks that every saved context contains valid action binding overrides.
 * @param {unknown} value Value to read, validate, format, or assign.
 * @returns {boolean} Checks that every saved context contains valid action binding overrides.
 */
export default function(value: unknown): value is InputPreferences {
  return !!value && typeof value === 'object' && !Array.isArray(value)
    && Object.entries(value).every(([context, bindings]) => context.trim() && isInputBindings(bindings));
}
