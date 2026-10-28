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
   * Pointer y configuration or state owned by ScrollbarDrag.
   * @property {number} pointerY
   */
  pointerY: number;
  /**
   * Vertical scroll offset of the container contents.
   * @property {number} scrollY
   */
  scrollY: number;
  /**
   * Dragging thumb configuration or state owned by ScrollbarDrag.
   * @property {boolean} draggingThumb
   */
  draggingThumb: boolean;
  /**
   * Moved configuration or state owned by ScrollbarDrag.
   * @property {boolean} moved
   */
  moved: boolean;
}
