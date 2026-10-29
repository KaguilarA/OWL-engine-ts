import type { CircleBody } from '../entities';
import type { PhysicsWorldOptions } from '../interfaces';
import { signalValue, type SignalValue } from 'reactive-values';

/**
 * Advances scene-owned circular bodies with fixed time steps and pair collisions.
 * @class PhysicsWorld
 */
export default class {
  /**
   * Downward acceleration applied to each body.
   * @property {number} gravityY
   * @public
   * @readonly
   */
  public readonly gravityY: number;

  /**
   * Fixed simulation interval in seconds.
   * @property {number} fixedTimeStep
   * @public
   * @readonly
   */
  public readonly fixedTimeStep: number;

  /**
   * Maximum simulation steps taken by one update.
   * @property {number} maxSubSteps
   * @public
   * @readonly
   */
  public readonly maxSubSteps: number;

  /**
   * Restitution applied to body-to-body impacts.
   * @property {number} restitution
   * @public
   * @readonly
   */
  public readonly restitution: number;

  /**
   * Bodies currently owned by this world.
   * @property {CircleBody[]} bodies
   * @private
   * @readonly
   */
  private readonly bodies: CircleBody[] = [];

  /**
   * Unsimulated time carried into the next update.
   * @property {SignalValue<number>} accumulatedTime
   * @private
   * @readonly
   */
  private readonly accumulatedTime: SignalValue<number> = signalValue(0);

  /**
   * Creates a physics world for bodies belonging to one scene or game.
   * @param options Gravity and fixed-step simulation settings.
   * @constructor
   * @returns {void}
   */
  public constructor(options: PhysicsWorldOptions = {}) {
    this.gravityY = options.gravityY ?? 0;
    this.fixedTimeStep = options.fixedTimeStep ?? 1 / 60;
    this.maxSubSteps = options.maxSubSteps ?? 5;
    this.restitution = options.restitution ?? 0.82;
    this.validateOptions();
  }

  /**
   * Adds a circular body to the simulation once.
   * @public
   * @return {void}
   * @param {CircleBody} body The body supplied to this operation.
   */
  public addBody(body: CircleBody): void {
    if (!this.bodies.includes(body)) this.bodies.push(body);
  }

  /**
   * Removes a circular body and reports whether it was present.
   * @public
   * @return {boolean}
   * @param {CircleBody} body The body supplied to this operation.
   */
  public removeBody(body: CircleBody): boolean {
    const index = this.bodies.indexOf(body);
    if (index < 0) return false;
    this.bodies.splice(index, 1);
    return true;
  }

  /**
   * Returns a snapshot of the bodies currently in the simulation.
   * @public
   * @return {readonly CircleBody[]}
   */
  public getBodies(): readonly CircleBody[] {
    return this.bodies.slice();
  }

  /**
   * Accumulates frame time and advances the world in bounded fixed steps.
   * @public
   * @param {number} deltaSeconds Duration of the frame in seconds.
   * @return {void}
   */
  public update(deltaSeconds: number): void {
    if (!Number.isFinite(deltaSeconds) || deltaSeconds < 0) {
      throw new RangeError('Physics delta seconds must be finite and non-negative.');
    }
    this.accumulatedTime.set(this.accumulatedTime() + deltaSeconds);
    let steps = 0;
    while (this.accumulatedTime() >= this.fixedTimeStep && steps < this.maxSubSteps) {
      this.step(this.fixedTimeStep);
      this.accumulatedTime.set(this.accumulatedTime() - this.fixedTimeStep);
      steps++;
    }
    if (steps === this.maxSubSteps && this.accumulatedTime() >= this.fixedTimeStep) {
      this.accumulatedTime.set(this.accumulatedTime() % this.fixedTimeStep);
    }
  }

  /**
   * Advances each body and resolves all overlapping body pairs.
   * @private
   * @param {number} deltaSeconds Duration of the fixed simulation step.
   * @return {void}
   */
  private step(deltaSeconds: number): void {
    for (const body of this.bodies) {
      body.motion.update(deltaSeconds, body.motion.accelerationY() + this.gravityY);
    }
    for (let firstIndex = 0; firstIndex < this.bodies.length; firstIndex++) {
      for (let secondIndex = firstIndex + 1; secondIndex < this.bodies.length; secondIndex++) {
        this.resolvePair(this.bodies[firstIndex], this.bodies[secondIndex]);
      }
    }
  }

  /**
   * Separates an equal-mass circle pair and exchanges their normal velocity.
   * @private
   * @param {CircleBody} first First colliding body.
   * @param {CircleBody} second Second colliding body.
   * @return {void}
   */
  private resolvePair(first: CircleBody, second: CircleBody): void {
    const dx = second.x - first.x;
    const dy = second.y - first.y;
    const minimumDistance = first.radius + second.radius;
    const distanceSquared = dx * dx + dy * dy;
    if (distanceSquared >= minimumDistance * minimumDistance) return;

    const distance = Math.sqrt(distanceSquared);
    const normalX = distance > 0 ? dx / distance : 1;
    const normalY = distance > 0 ? dy / distance : 0;
    const separation = (minimumDistance - distance) * 0.5;
    first.setPosition(first.x - normalX * separation, first.y - normalY * separation);
    second.setPosition(second.x + normalX * separation, second.y + normalY * separation);

    const relativeVelocityX = second.velocityX - first.velocityX;
    const relativeVelocityY = second.velocityY - first.velocityY;
    const velocityAlongNormal = relativeVelocityX * normalX + relativeVelocityY * normalY;
    if (velocityAlongNormal >= 0) return;

    const impulse = -(1 + this.restitution) * velocityAlongNormal * 0.5;
    first.setVelocity(
      first.velocityX - impulse * normalX,
      first.velocityY - impulse * normalY
    );
    second.setVelocity(
      second.velocityX + impulse * normalX,
      second.velocityY + impulse * normalY
    );
  }

  /**
   * Rejects invalid gravity, time-step, and restitution settings.
   * @private
   * @return {void}
   */
  private validateOptions(): void {
    if (!Number.isFinite(this.gravityY)) {
      throw new RangeError('Physics world gravity must be finite.');
    }
    if (!Number.isFinite(this.fixedTimeStep) || this.fixedTimeStep <= 0) {
      throw new RangeError('Physics fixed time step must be greater than zero.');
    }
    if (!Number.isInteger(this.maxSubSteps) || this.maxSubSteps <= 0) {
      throw new RangeError('Physics maximum substeps must be a positive integer.');
    }
    if (!Number.isFinite(this.restitution) || this.restitution < 0 || this.restitution > 1) {
      throw new RangeError('Physics restitution must be between zero and one.');
    }
  }
}
