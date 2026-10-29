import { PhysicsBody } from '../core';

/**
 * Reactive circular collision body backed by the engine's 2D integrator.
 * @class CircleBody
 */
export default class {
  /**
   * Motion configuration or state owned by CircleBody.
   * @property {default} motion
   * @readonly
   * @public
   */
  public readonly motion: PhysicsBody;
  /**
   * Radius of the circular shape.
   * @property {number} radius
   * @readonly
   * @public
   */
  public readonly radius: number;

  /**
   * Initializes CircleBody and its owned resources from the supplied arguments.
   * @constructor
   * @param {number} x Horizontal coordinate in the owning coordinate space.
   * @param {number} y Vertical coordinate in the owning coordinate space.
   * @param {number} radius Radius of the circular shape.
   * @returns {void}
   * @public
   */
  public constructor(x: number, y: number, radius: number) {
    if (!Number.isFinite(radius) || radius <= 0) {
      throw new RangeError('Circle radius must be a positive finite number.');
    }
    this.motion = new PhysicsBody(x, y);
    this.radius = radius;
  }

  /**
   * Returns x from the current CircleBody state.
   * @returns {number} x from the current CircleBody state.
   * @public
   */
  public get x(): number { return this.motion.x(); }
  /**
   * Returns y from the current CircleBody state.
   * @returns {number} y from the current CircleBody state.
   * @public
   */
  public get y(): number { return this.motion.y(); }
  /**
   * Returns velocity x from the current CircleBody state.
   * @returns {number} velocity x from the current CircleBody state.
   * @public
   */
  public get velocityX(): number { return this.motion.velocityX(); }
  /**
   * Returns velocity y from the current CircleBody state.
   * @returns {number} velocity y from the current CircleBody state.
   * @public
   */
  public get velocityY(): number { return this.motion.velocityY(); }

  /**
   * Updates position for CircleBody.
   * @param {number} x Horizontal coordinate in the owning coordinate space.
   * @param {number} y Vertical coordinate in the owning coordinate space.
   * @returns {void}
   * @public
   */
  public setPosition(x: number, y: number): void {
    this.motion.setPosition(x, y);
  }

  /**
   * Updates velocity for CircleBody.
   * @param {number} x Horizontal coordinate in the owning coordinate space.
   * @param {number} y Vertical coordinate in the owning coordinate space.
   * @returns {void}
   * @public
   */
  public setVelocity(x: number, y: number): void {
    this.motion.setVelocity(x, y);
  }

  /**
   * Adds velocity for CircleBody.
   * @param {number} x Horizontal coordinate in the owning coordinate space.
   * @param {number} y Vertical coordinate in the owning coordinate space.
   * @returns {void}
   * @public
   */
  public addVelocity(x: number, y: number): void {
    this.setVelocity(this.velocityX + x, this.velocityY + y);
  }

  /**
   * Advances CircleBody simulation and dependent presentation state for one frame.
   * @param {number} deltaSeconds Elapsed simulation time in seconds.
   * @param {number} [gravityY] The gravity y supplied to this operation.
   * @returns {void}
   * @public
   */
  public update(deltaSeconds: number, gravityY = 0): void {
    this.motion.update(deltaSeconds, gravityY);
  }
}
