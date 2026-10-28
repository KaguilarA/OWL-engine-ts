/**
 * Defines the touch control circle contract shared by its consumers.
 * @interface TouchControlCircle
 */
export interface TouchControlCircle {
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
   * Radius of the circular shape.
   * @property {number} radius
   */
  radius: number;
}
