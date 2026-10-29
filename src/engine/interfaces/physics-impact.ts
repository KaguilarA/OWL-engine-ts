/**
 * First time of contact during a linear sweep, expressed as a fraction of the displacement.
 * @interface PhysicsImpact
 */
export interface PhysicsImpact {
  /**
   * Sweep fraction between zero and one.
   * @property {number} fraction
   */
  readonly fraction: number;
  /**
   * Normal directed from the first collider toward the second.
   * @property {number} normalX
   */
  readonly normalX: number;
  /**
   * Vertical normal component.
   * @property {number} normalY
   */
  readonly normalY: number;
}
