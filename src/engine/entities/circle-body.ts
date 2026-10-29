import { RigidBody2D } from '../core';
import type { RigidBodyOptions } from '../interfaces';

/**
 * Backward-compatible circle collider sharing the general rigid-body motion and filtering model.
 * @class CircleBody
 */
export default class extends RigidBody2D {
  /**
   * Creates a validated circle with dynamic, equal-mass defaults matching the legacy API.
   * @param {number} x Initial horizontal center.
   * @param {number} y Initial vertical center.
   * @param {number} radius Positive circle radius.
   * @param {object} [options] Optional type, mass, sensor, material, and category configuration.
   * @returns {void}
   */
  public constructor(x: number, y: number, radius: number, options: Omit<RigidBodyOptions, 'shape' | 'x' | 'y'> = {}) {
    super({ ...options, x, y, shape: { kind: 'circle', radius } });
  }

  /**
   * Returns the immutable radius from the validated collider geometry.
   * @returns {number} Circle radius in world units.
   */
  public get radius(): number { return this.shape.radius!; }
}
