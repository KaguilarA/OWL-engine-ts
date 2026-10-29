import { PhysicsGeometry, type RigidBody2D } from './';
import type { PhysicsPoint } from '../interfaces';

/**
 * Stateless sweep-and-prune candidate generator using current or swept axis-aligned bounds.
 * @class PhysicsBroadPhase
 */
export default (class {
  /**
   * Shared broad-phase algorithm; body collections remain world-owned.
   * @property {PhysicsBroadPhase} instance
   */
  public static readonly instance = new this();
  /**
   * Restricts the stateless algorithm to one instance.
   * @constructor
   * @returns {void}
   * @private
   */
  private constructor() {}

  /**
   * Sorts bounds along X and rejects separated Y ranges and incompatible category masks.
   * @param {readonly RigidBody2D[]} bodies Registered world colliders in stable order.
   * @param {ReadonlyMap<RigidBody2D, PhysicsPoint>} [moves] Optional proposed displacements for continuous detection.
   * @returns {Array<readonly [RigidBody2D, RigidBody2D]>} Potential pairs, each ordered by registration.
   */
  public pairs(bodies: readonly RigidBody2D[], moves?: ReadonlyMap<RigidBody2D, PhysicsPoint>): Array<readonly [RigidBody2D, RigidBody2D]> {
    const entries = bodies.map((body, order) => {
      const bounds = body.bounds(), move = moves?.get(body);
      const dx = move?.x ?? 0, dy = move?.y ?? 0;
      return { body, order, x: bounds.x + Math.min(0, dx), y: bounds.y + Math.min(0, dy), right: bounds.x + bounds.width + Math.max(0, dx), bottom: bounds.y + bounds.height + Math.max(0, dy) };
    }).sort((a, b) => a.x - b.x || a.order - b.order);
    const pairs: Array<readonly [RigidBody2D, RigidBody2D]> = [];
    for (let i = 0; i < entries.length; i++) {
      const a = entries[i];
      for (let j = i + 1; j < entries.length; j++) {
        const b = entries[j];
        if (b.x > a.right + PhysicsGeometry.epsilon) break;
        if (b.y > a.bottom + PhysicsGeometry.epsilon || a.y > b.bottom + PhysicsGeometry.epsilon) continue;
        if (!(a.body.mask & b.body.layer) || !(b.body.mask & a.body.layer)) continue;
        if (a.body.bodyType === 'static' && b.body.bodyType === 'static' && !a.body.sensor && !b.body.sensor) continue;
        pairs.push(a.order < b.order ? [a.body, b.body] : [b.body, a.body]);
      }
    }
    return pairs;
  }
}).instance;
