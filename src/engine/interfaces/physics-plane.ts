import type { PhysicsPoint } from './';

/**
 * Convex boundary half-plane anchored at a vertex with an outward unit normal.
 * @interface PhysicsPlane
 */
export interface PhysicsPlane extends PhysicsPoint {
  /**
   * Horizontal outward normal component.
   * @property {number} normalX
   */
  readonly normalX: number;
  /**
   * Vertical outward normal component.
   * @property {number} normalY
   */
  readonly normalY: number;
}
