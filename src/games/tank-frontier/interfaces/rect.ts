/**
 * Defines the rect contract shared by its consumers.
 * @interface Rect
 */
export interface Rect {
  /**
   * Horizontal coordinate in the owning coordinate space.
   * @property {number} x
   */
  x: number;
  /**
   * Vertical coordinate in the owning coordinate space.
   * @property {number} y
   */
  y: number;
  /**
   * Width of the represented area.
   * @property {number} width
   */
  width: number;
  /**
   * Height of the represented area.
   * @property {number} height
   */
  height: number;
}
