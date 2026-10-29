/**
 * Circular bumper geometry shared by Pinball rendering and collider construction.
 * @interface PinballBumper
 */
export interface PinballBumper {
  /**
   * Horizontal world-space center.
   * @property {number} x
   */
  x: number;
  /**
   * Vertical world-space center.
   * @property {number} y
   */
  y: number;
  /**
   * Radius of the solid circular bumper.
   * @property {number} radius
   */
  radius: number;
}
