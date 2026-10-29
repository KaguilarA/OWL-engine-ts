import { PhysicsBody } from '../core';

/**
 * Reusable falling pickup motion and centered world-space geometry.
 * @class FallingPickup
 */
export default class {
  /**
   * Physics configuration or state owned by FallingPickup.
   * @property {default} physics
   * @readonly
   * @public
   */
  public readonly physics: PhysicsBody;
  /**
   * Size configuration or state owned by FallingPickup.
   * @property {number} size
   * @readonly
   * @public
   */
  public readonly size: number;

  /**
   * Initializes FallingPickup and its owned resources from the supplied arguments.
   * @constructor
   * @param {number} x Horizontal coordinate in the owning coordinate space.
   * @param {number} y Vertical coordinate in the owning coordinate space.
   * @param {number} size The size supplied to this operation.
   * @param {number} [fallSpeed] The fall speed supplied to this operation.
   * @returns {void}
   * @public
   */
  public constructor(x: number, y: number, size: number, fallSpeed = 180) {
    this.physics = new PhysicsBody(x, y);
    this.size = size;
    this.physics.setVelocity(0, fallSpeed);
  }

  /**
   * Returns x from the current FallingPickup state.
   * @returns {number} x from the current FallingPickup state.
   * @public
   */
  public get x(): number {
    return this.physics.x();
  }

  /**
   * Returns y from the current FallingPickup state.
   * @returns {number} y from the current FallingPickup state.
   * @public
   */
  public get y(): number {
    return this.physics.y();
  }

  /**
   * Advances FallingPickup simulation and dependent presentation state for one frame.
   * @param {number} deltaSeconds Elapsed simulation time in seconds.
   * @returns {void}
   * @public
   */
  public update(deltaSeconds: number): void {
    this.physics.update(deltaSeconds);
  }
}
