import type { InputBindings } from '../interfaces';

/**
 * Independent defaults for each context; no mutable shared binding arrays.
 * @param {string} context Name of the input context whose bindings are requested.
 * @returns {InputBindings}
 */
export default function(context: string): InputBindings {
  const bindings: InputBindings = {
    moveLeft: { keys: ['ArrowLeft', 'a'], buttons: [14], axes: [{ index: 0, direction: -1 }] },
    moveRight: { keys: ['ArrowRight', 'd'], buttons: [15], axes: [{ index: 0, direction: 1 }] },
    moveUp: { keys: ['ArrowUp', 'w'], buttons: [12], axes: [{ index: 1, direction: -1 }] },
    moveDown: { keys: ['ArrowDown', 's'], buttons: [13], axes: [{ index: 1, direction: 1 }] },
    confirm: { keys: ['Enter', ' '], buttons: [0] },
    back: { keys: ['Escape'], buttons: [1] }
  };
  if (context === 'menu' || context === 'editor') return bindings;
  return {
    ...bindings,
    attack: { keys: context === 'moonfall' ? ['z'] : [' '], buttons: [context === 'moonfall' ? 2 : 0] },
    jump: { keys: [' ', 'ArrowUp', 'w'], buttons: [0] },
    dash: { keys: ['Shift', 'x'], buttons: [1] },
    polarity: { keys: ['Shift', 'c'], buttons: [2] },
    interact: { keys: ['Enter', ' ', 'e'], buttons: [0] },
    launch: { keys: [' ', 'Enter'], buttons: [0] },
    spin: { keys: [' '], buttons: [0] },
    drop: { keys: [' ', 'Enter'], buttons: [0] },
    pause: { keys: ['p', 'Escape'], buttons: [9] },
    // Back to menu must not conflict with dash or pause during gameplay.
    back: { keys: ['Backspace'], buttons: [8] }
  };
}
