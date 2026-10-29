import { computedValue, signalValue, type ComputedValue } from 'reactive-values';
import { PhysicsBody, PhysicsGeometry, type PhysicsWorld } from './';
import type { CollisionRect, PhysicsPoint, PhysicsShape, RigidBodyOptions } from '../interfaces';

/**
 * Scene-owned translational rigid body sharing the existing reactive motion integrator.
 * Geometry may be rotated explicitly; angular momentum and torque are not simulated.
 * @class RigidBody2D
 */
export default class {
  /**
   * Reactive position, velocity, and acceleration in world coordinates.
   * @property {PhysicsBody} motion
   */
  public readonly motion: PhysicsBody;
  /**
   * Validated, deeply frozen local collider geometry.
   * @property {PhysicsShape} shape
   */
  public readonly shape: PhysicsShape;
  /**
   * Immutable integration and collision-response classification.
   * @property {string} bodyType
   */
  public readonly bodyType: 'dynamic' | 'static' | 'kinematic';
  /**
   * Dynamic inverse mass; zero for bodies whose trajectory is prescribed.
   * @property {number} inverseMass
   */
  public readonly inverseMass: number;
  /**
   * Whether contacts are reported without resolving motion.
   * @property {boolean} sensor
   */
  public readonly sensor: boolean;
  /**
   * Unsigned category bitset used by collision and query filtering.
   * @property {number} layer
   */
  public readonly layer: number;
  /**
   * Categories accepted by this collider.
   * @property {number} mask
   */
  public readonly mask: number;
  /**
   * Optional bounce override; the world's restitution is used when absent.
   * @property {number | undefined} restitution
   */
  public readonly restitution: number | undefined;
  /**
   * Whether this unrotated platform accepts only upper-face landings.
   * @property {boolean} oneWay
   */
  public readonly oneWay: boolean;
  /**
   * Explicit collider orientation in radians; held fixed during each sweep.
   * @property {SignalValue<number>} angle
   */
  public readonly angle = signalValue(0);
  /**
   * World boundary derived from reactive position and orientation, without a parallel mutable cache.
   * @property {ComputedValue<readonly PhysicsPoint[]>} vertices
   */
  public readonly vertices: ComputedValue<readonly PhysicsPoint[]>;
  /**
   * Axis-aligned bounds derived from the same reactive transform.
   * @property {ComputedValue<CollisionRect>} bounds
   */
  public readonly bounds: ComputedValue<CollisionRect>;
  /**
   * Reactive scene ownership; a collider cannot be integrated by two worlds at once.
   * @property {SignalValue<PhysicsWorld | undefined>} owner
   * @private
   */
  private readonly owner = signalValue<PhysicsWorld | undefined>(undefined);

  /**
   * Validates material, filtering, and geometry before acquiring any world ownership.
   * @param {RigidBodyOptions} options Initial geometry, position, and immutable body configuration.
   * @returns {void}
   * @throws {RangeError} When dimensions, mass, orientation, or bitsets are invalid.
   */
  public constructor(options: RigidBodyOptions) {
    this.shape = PhysicsGeometry.copyShape(options.shape);
    this.bodyType = options.type ?? 'dynamic';
    const mass = options.mass ?? 1;
    this.sensor = options.sensor ?? false;
    this.layer = options.layer ?? 1;
    this.mask = options.mask ?? 0xffffffff;
    this.restitution = options.restitution;
    this.oneWay = options.oneWay ?? false;
    this.angle.set(options.angle ?? 0);
    if (!['dynamic', 'static', 'kinematic'].includes(this.bodyType) || !Number.isFinite(mass) || mass <= 0 || !Number.isFinite(1 / mass)
      || !Number.isFinite(this.angle()) || [this.layer, this.mask].some(value => !Number.isInteger(value) || value < 0 || value > 0xffffffff)
      || (this.restitution !== undefined && (!Number.isFinite(this.restitution) || this.restitution < 0 || this.restitution > 1))) {
      throw new RangeError('Invalid rigid body type, mass, angle, restitution, or category bitset.');
    }
    if (this.oneWay && (this.bodyType === 'dynamic' || this.shape.kind !== 'box' || this.angle() !== 0)) {
      throw new RangeError('One-way platforms require a static or kinematic unrotated box.');
    }
    this.inverseMass = this.bodyType === 'dynamic' ? 1 / mass : 0;
    this.motion = new PhysicsBody(options.x ?? 0, options.y ?? 0);
    this.vertices = computedValue(() => PhysicsGeometry.vertices(this), [this.motion.x, this.motion.y, this.angle]);
    this.bounds = computedValue(() => PhysicsGeometry.bounds(this), [this.motion.x, this.motion.y, this.angle]);
  }

  /**
   * Reads the horizontal body origin.
   * @returns {number} Current horizontal position.
   */
  public get x(): number { return this.motion.x(); }
  /**
   * Reads the vertical body origin.
   * @returns {number} Current vertical position.
   */
  public get y(): number { return this.motion.y(); }
  /**
   * Reads horizontal velocity in world units per second.
   * @returns {number} Current horizontal velocity.
   */
  public get velocityX(): number { return this.motion.velocityX(); }
  /**
   * Reads vertical velocity in world units per second.
   * @returns {number} Current vertical velocity.
   */
  public get velocityY(): number { return this.motion.velocityY(); }

  /**
   * Claims registration for one physics world without duplicating ownership state.
   * @param {PhysicsWorld} world World acquiring this collider.
   * @returns {void}
   * @throws {Error} When a different world already owns this collider.
   */
  public attachWorld(world: PhysicsWorld): void {
    if (this.owner() && this.owner() !== world) throw new Error('A collider may belong to only one physics world.');
    this.owner.set(world);
  }

  /**
   * Releases registration only when requested by the owning world.
   * @param {PhysicsWorld} world World releasing this collider.
   * @returns {void}
   */
  public detachWorld(world: PhysicsWorld): void { if (this.owner() === world) this.owner.set(undefined); }

  /**
   * Teleports the collider without changing its velocity.
   * @param {number} x Horizontal origin.
   * @param {number} y Vertical origin.
   * @returns {void}
   */
  public setPosition(x: number, y: number): void { this.motion.setPosition(x, y); }
  /**
   * Assigns linear velocity; static bodies retain it as metadata but never integrate it.
   * @param {number} x Horizontal velocity.
   * @param {number} y Vertical velocity.
   * @returns {void}
   */
  public setVelocity(x: number, y: number): void { this.motion.setVelocity(x, y); }
  /**
   * Adds an instantaneous velocity change.
   * @param {number} x Horizontal velocity increment.
   * @param {number} y Vertical velocity increment.
   * @returns {void}
   */
  public addVelocity(x: number, y: number): void { this.setVelocity(this.velocityX + x, this.velocityY + y); }
  /**
   * Integrates dynamic forces or prescribed kinematic velocity; static bodies remain fixed.
   * @param {number} deltaSeconds Finite, nonnegative simulation duration.
   * @param {number} [gravityY] Additional world gravity applied only to dynamic bodies.
   * @returns {void}
   */
  public update(deltaSeconds: number, gravityY = 0): void {
    if (!Number.isFinite(deltaSeconds) || deltaSeconds < 0 || !Number.isFinite(gravityY)) throw new RangeError('Invalid physics time or gravity.');
    if (this.bodyType === 'dynamic') this.motion.update(deltaSeconds, this.motion.accelerationY() + gravityY);
    else if (this.bodyType === 'kinematic') this.setPosition(this.x + this.velocityX * deltaSeconds, this.y + this.velocityY * deltaSeconds);
  }
}
