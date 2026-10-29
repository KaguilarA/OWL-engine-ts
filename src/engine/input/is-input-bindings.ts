import type { InputBindings } from '../interfaces';

/**
 * Reject malformed persisted or user-supplied mappings before applying them.
 * @param {unknown} value Value to validate or apply.
 * @returns {boolean}
 */
export default function(value: unknown): value is InputBindings {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  return Object.entries(value).every(([name, entry]) => {
    if (!name.trim() || !entry || typeof entry !== 'object' || Array.isArray(entry)) return false;
    const binding = entry as Record<string, unknown>;
    return Object.keys(binding).every((key) => ['keys', 'buttons', 'axes'].includes(key))
      && (binding.keys === undefined || (Array.isArray(binding.keys)
        && binding.keys.every((key) => typeof key === 'string' && key.length > 0)))
      && (binding.buttons === undefined || (Array.isArray(binding.buttons)
        && binding.buttons.every((button) => Number.isInteger(button) && button >= 0)))
      && (binding.axes === undefined || (Array.isArray(binding.axes)
        && binding.axes.every((axis) => axis && Number.isInteger(axis.index) && axis.index >= 0
          && (axis.direction === -1 || axis.direction === 1))));
  });
}
