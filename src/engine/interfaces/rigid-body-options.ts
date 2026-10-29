import type { PhysicsShape } from './';

/**
 * Immutable collider configuration; runtime motion and angle are reactive body values.
 * @interface RigidBodyOptions
 */
export interface RigidBodyOptions {
  /**
   * Collider geometry, validated and copied on construction.
   * @property {PhysicsShape} shape
   */
  shape: PhysicsShape;
  /**
   * Initial horizontal origin.
   * @property {number | undefined} x
   */
  x?: number;
  /**
   * Initial vertical origin.
   * @property {number | undefined} y
   */
  y?: number;
  /**
   * Dynamic bodies receive forces and impulses; kinematic bodies follow velocity; static bodies do not integrate.
   * @property {string | undefined} type
   */
  type?: 'dynamic' | 'static' | 'kinematic';
  /**
   * Positive dynamic mass; static and kinematic bodies have zero inverse mass.
   * @property {number | undefined} mass
   */
  mass?: number;
  /**
   * Fixed-orientation collider angle in radians; angular impulses are not simulated.
   * @property {number | undefined} angle
   */
  angle?: number;
  /**
   * Whether this collider reports contacts without producing impulses.
   * @property {boolean | undefined} sensor
   */
  sensor?: boolean;
  /**
   * Unsigned category bitset; defaults to 1.
   * @property {number | undefined} layer
   */
  layer?: number;
  /**
   * Unsigned bitset of categories accepted for contact; defaults to all categories.
   * @property {number | undefined} mask
   */
  mask?: number;
  /**
   * Optional bounce coefficient between zero and one, overriding the world's default.
   * @property {number | undefined} restitution
   */
  restitution?: number;
  /**
   * Whether a non-dynamic, unrotated box blocks only landings on its upper face.
   * @property {boolean | undefined} oneWay
   */
  oneWay?: boolean;
}
