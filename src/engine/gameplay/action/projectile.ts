import { signalValue, type SignalValue } from 'reactive-values';
import { PhysicsBody } from '../../core';

/**
 * Reusable timed projectile with reactive motion and pooled reset support.
 * @class Projectile
 */
export default class Projectile {
  /**
   * Reactive position and velocity of the projectile.
   * @property {PhysicsBody} body
   * @public
   * @readonly
   */
  public readonly body: PhysicsBody;

  /**
   * Damage applied when the projectile hits a target.
   * @property {SignalValue<number>} damage
   * @public
   * @readonly
   */
  public readonly damage: SignalValue<number>;

  /**
   * Remaining time before the projectile expires.
   * @property {SignalValue<number>} remainingLifetime
   * @public
   * @readonly
   */
  public readonly remainingLifetime: SignalValue<number>;

  /**
   * Whether the projectile can still update and collide.
   * @property {SignalValue<boolean>} active
   * @public
   * @readonly
   */
  public readonly active: SignalValue<boolean> = signalValue(true);

  /**
   * Creates a projectile with initial motion, damage, and lifetime.
   * @param x Initial horizontal position.
   * @param y Initial vertical position.
   * @param velocityX Initial horizontal velocity.
   * @param velocityY Initial vertical velocity.
   * @param damage Damage dealt on impact.
   * @param lifetime Lifetime in seconds.
   * @public
   * @return {void}
   */
  public constructor(
    x: number,
    y: number,
    velocityX: number,
    velocityY: number,
    damage: number,
    lifetime: number
  ) {
    if (!Number.isFinite(damage) || damage < 0) throw new RangeError('Projectile damage must be finite and non-negative.');
    if (!Number.isFinite(lifetime) || lifetime <= 0) throw new RangeError('Projectile lifetime must be finite and positive.');
    this.body = new PhysicsBody(x, y);
    this.body.setVelocity(velocityX, velocityY);
    this.damage = signalValue(damage);
    this.remainingLifetime = signalValue(lifetime);
  }

  /**
   * Advances motion and deactivates the projectile when its lifetime expires.
   * @param deltaSeconds Duration of the frame in seconds.
   * @public
   * @return {void}
   */
  public update(deltaSeconds: number): void {
    if (!Number.isFinite(deltaSeconds) || deltaSeconds < 0) {
      throw new RangeError('Projectile delta seconds must be finite and non-negative.');
    }
    if (!this.active()) return;
    const remaining = this.remainingLifetime() - deltaSeconds;
    if (remaining <= 0) {
      this.remainingLifetime.set(0);
      this.active.set(false);
      return;
    }
    this.remainingLifetime.set(remaining);
    this.body.update(deltaSeconds);
  }

  /**
   * Reuses the projectile with new motion, damage, and lifetime values.
   * @param x New horizontal position.
   * @param y New vertical position.
   * @param velocityX New horizontal velocity.
   * @param velocityY New vertical velocity.
   * @param damage New impact damage.
   * @param lifetime New lifetime in seconds.
   * @public
   * @return {void}
   */
  public reset(
    x: number,
    y: number,
    velocityX: number,
    velocityY: number,
    damage: number,
    lifetime: number
  ): void {
    if (!Number.isFinite(damage) || damage < 0) throw new RangeError('Projectile damage must be finite and non-negative.');
    if (!Number.isFinite(lifetime) || lifetime <= 0) throw new RangeError('Projectile lifetime must be finite and positive.');
    this.body.setPosition(x, y);
    this.body.setVelocity(velocityX, velocityY);
    this.damage.set(damage);
    this.remainingLifetime.set(lifetime);
    this.active.set(true);
  }
}
