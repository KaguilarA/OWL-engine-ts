import type { RigidBody2D } from '../core';

/**
 * Contact manifold whose normal points from the first collider toward the second.
 * @interface PhysicsContact
 */
export interface PhysicsContact {
  /**
   * First collider in world registration order.
   * @property {RigidBody2D} first
   */
  readonly first: RigidBody2D;
  /**
   * Second collider in the pair.
   * @property {RigidBody2D} second
   */
  readonly second: RigidBody2D;
  /**
   * Horizontal component of the unit separation normal.
   * @property {number} normalX
   */
  readonly normalX: number;
  /**
   * Vertical component of the unit separation normal.
   * @property {number} normalY
   */
  readonly normalY: number;
  /**
   * Nonnegative overlap depth; swept contacts begin with zero depth.
   * @property {number} depth
   */
  readonly depth: number;
}
