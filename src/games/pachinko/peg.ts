/**
 * Defines the pachinko peg contract shared by its consumers.
 * @interface PachinkoPeg
 */
export interface PachinkoPeg {
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

