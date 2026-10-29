import type { PhysicsPoint } from './';

/**
 * Collider geometry; circles and boxes are centered on the body, polygon vertices are local coordinates.
 * @interface PhysicsShape
 */
export interface PhysicsShape {
  /**
   * Geometry discriminator controlling which dimensions are required.
   * @property {string} kind
   */
  readonly kind: 'circle' | 'box' | 'polygon';
  /**
   * Positive circle radius.
   * @property {number | undefined} radius
   */
  readonly radius?: number;
  /**
   * Positive box width.
   * @property {number | undefined} width
   */
  readonly width?: number;
  /**
   * Positive box height.
   * @property {number | undefined} height
   */
  readonly height?: number;
  /**
   * At least three strictly convex boundary vertices in either winding order.
   * @property {readonly PhysicsPoint[] | undefined} vertices
   */
  readonly vertices?: readonly PhysicsPoint[];
}
