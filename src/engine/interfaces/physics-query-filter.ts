import type { RigidBody2D } from '../core';

/**
 * Optional category, sensor, and application filters for world queries.
 * @interface PhysicsQueryFilter
 */
export interface PhysicsQueryFilter {
  /**
   * Categories included in the query; defaults to all categories.
   * @property {number | undefined} mask
   */
  mask?: number;
  /**
   * Whether sensor colliders are returned; defaults to true.
   * @property {boolean | undefined} includeSensors
   */
  includeSensors?: boolean;
  /**
   * Additional collider selection predicate.
   * @property {Function | undefined} predicate
   */
  predicate?: (body: RigidBody2D) => boolean;
}
