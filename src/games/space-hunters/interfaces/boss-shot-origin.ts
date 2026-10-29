/**
 * Defines the boss shot origin contract shared by its consumers.
 * @interface BossShotOrigin
 */
export interface BossShotOrigin {
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
}
