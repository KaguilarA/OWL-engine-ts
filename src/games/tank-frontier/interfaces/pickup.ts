/**
 * Defines the pickup contract shared by its consumers.
 * @interface Pickup
 */
export interface Pickup {
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
   * Size configuration or state owned by Pickup.
   * @property {number} size
   */
  size: number;
}
