/**
 * Immutable coordinate used by collider geometry and world-space queries.
 * @interface PhysicsPoint
 */
export interface PhysicsPoint {
  /**
   * Horizontal coordinate.
   * @property {number} x
   */
  readonly x: number;
  /**
   * Vertical coordinate; positive values point down.
   * @property {number} y
   */
  readonly y: number;
}
