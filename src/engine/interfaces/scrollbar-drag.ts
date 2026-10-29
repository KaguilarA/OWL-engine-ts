/**
 * Defines the scrollbar drag contract shared by its consumers.
 * @interface ScrollbarDrag
 */
export interface ScrollbarDrag {
  /**
   * Identifier of the pointer owning the interaction.
   * @property {number} pointerId
   */
  pointerId: number;
  /**
   * Pointer position recorded when the scrollbar drag began.
   * @property {number} pointerY
   */
  pointerY: number;
  /**
   * Scroll offset recorded when the scrollbar drag began.
   * @property {number} scrollY
   */
  scrollY: number;
  /**
   * Whether the interaction began on the scrollbar thumb.
   * @property {boolean} draggingThumb
   */
  draggingThumb: boolean;
  /**
   * Whether the current scrollbar interaction has become a drag.
   * @property {boolean} moved
   */
  moved: boolean;
}
