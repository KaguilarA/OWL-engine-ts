import type { RigidBody2D } from '../core';
import type { PhysicsImpact } from './';

/**
 * Segment query result; its normal points outward from the hit collider.
 * @interface PhysicsRayHit
 */
export interface PhysicsRayHit extends PhysicsImpact {
  /**
   * Collider intersected by the segment.
   * @property {RigidBody2D} body
   */
  readonly body: RigidBody2D;
  /**
   * Horizontal hit position.
   * @property {number} x
   */
  readonly x: number;
  /**
   * Vertical hit position.
   * @property {number} y
   */
  readonly y: number;
  /**
   * Distance from the segment origin to the first intersection.
   * @property {number} distance
   */
  readonly distance: number;
}
