/**
 * Serializable mapping from physical controls to one semantic action.
 * @typedef {InputBinding} InputBinding
 */
type InputBinding = {
  /**
   * Keys configuration or state owned by InputBinding.
   * @property {string[] | undefined} keys
   */
  keys?: string[];
  /**
   * Buttons configuration or state owned by InputBinding.
   * @property {number[] | undefined} buttons
   */
  buttons?: number[];
  /**
   * Axes configuration or state owned by InputBinding.
   * @property {{ index: number; direction: 1 | -1; }[] | undefined} axes
   */
  axes?: {
  /**
   * Index identifying the item within its collection.
   * @property {number} index
   */
  index: number;
  /**
   * Direction configuration or state owned by InputBinding.
   * @property {1 | -1} direction
   */
  direction: -1 | 1 }[];
};

export type { InputBinding as default };
