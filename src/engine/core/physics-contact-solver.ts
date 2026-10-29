import type { PhysicsContact } from '../interfaces';

/**
 * Stateless inverse-mass positional and linear-impulse contact solver.
 * Sensors and pairs with zero total inverse mass never receive a response.
 * @class PhysicsContactSolver
 */
export default (class {
  /**
   * Shared response algorithm; all mutable motion stays on colliders.
   * @property {PhysicsContactSolver} instance
   */
  public static readonly instance = new this();
  /**
   * Restricts construction of the response service.
   * @constructor
   * @returns {void}
   * @private
   */
  private constructor() {}

  /**
   * Separates penetration and removes closing normal velocity using the least restitution coefficient.
   * @param {PhysicsContact} contact First-to-second contact manifold.
   * @param {number} restitution World fallback bounce coefficient.
   * @returns {void}
   */
  public resolve(contact: PhysicsContact, restitution: number): void {
    const { first, second, normalX, normalY, depth } = contact;
    const mass = first.inverseMass + second.inverseMass;
    if (first.sensor || second.sensor || mass === 0) return;
    if (depth > 0) {
      first.setPosition(first.x - normalX * depth * first.inverseMass / mass, first.y - normalY * depth * first.inverseMass / mass);
      second.setPosition(second.x + normalX * depth * second.inverseMass / mass, second.y + normalY * depth * second.inverseMass / mass);
    }
    const firstX = first.bodyType === 'static' ? 0 : first.velocityX, firstY = first.bodyType === 'static' ? 0 : first.velocityY;
    const secondX = second.bodyType === 'static' ? 0 : second.velocityX, secondY = second.bodyType === 'static' ? 0 : second.velocityY;
    const speed = (secondX - firstX) * normalX + (secondY - firstY) * normalY;
    if (speed >= 0) return;
    const bounce = Math.min(first.restitution ?? restitution, second.restitution ?? restitution);
    const impulse = -(1 + bounce) * speed / mass;
    if (first.inverseMass) first.setVelocity(first.velocityX - impulse * normalX * first.inverseMass, first.velocityY - impulse * normalY * first.inverseMass);
    if (second.inverseMass) second.setVelocity(second.velocityX + impulse * normalX * second.inverseMass, second.velocityY + impulse * normalY * second.inverseMass);
  }
}).instance;
