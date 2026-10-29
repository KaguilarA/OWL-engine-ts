import { signalValue } from 'reactive-values';
import { RigidBody2D, type PhysicsWorld } from '../core';
import type { Tilemap } from './';
import type { TilemapPhysicsOptions } from '../interfaces';

/**
 * Scene-owned adapter deriving static tile colliders from reactive map cells, position, and signed scale.
 * @class TilemapCollider
 */
export default class {
  /**
   * Current collider instances generated exclusively by this adapter.
   * @property {SignalValue<readonly RigidBody2D[]>} bodies
   */
  public readonly bodies = signalValue<readonly RigidBody2D[]>([]);
  /**
   * Whether subscriptions and owned registrations have been released.
   * @property {SignalValue<boolean>} disposed
   */
  public readonly disposed = signalValue(false);
  /**
   * Map supplying collision geometry and reactive changes.
   * @property {Tilemap} map
   * @private
   */
  private readonly map: Tilemap;
  /**
   * Scene-local world receiving generated colliders.
   * @property {PhysicsWorld} world
   * @private
   */
  private readonly world: PhysicsWorld;
  /**
   * Immutable rule callbacks and category configuration.
   * @property {TilemapPhysicsOptions} options
   * @private
   */
  private readonly options: TilemapPhysicsOptions;
  /**
   * Reactive subscription removers released when the owning scene closes.
   * @property {Array<Function>} cleanups
   * @private
   */
  private readonly cleanups: Array<() => unknown> = [];
  /**
   * Reactive rebuild guard preventing callbacks from creating overlapping ownership transactions.
   * @property {SignalValue<boolean>} refreshing
   * @private
   */
  private readonly refreshing = signalValue(false);
  /**
   * Records another map change received during the current rebuild.
   * @property {SignalValue<boolean>} refreshPending
   * @private
   */
  private readonly refreshPending = signalValue(false);

  /**
   * Builds colliders and subscribes to cell and transform changes through reactive-values.
   * @param {Tilemap} map Rendered map supplying matching world cell bounds.
   * @param {PhysicsWorld} world Scene world owning these colliders.
   * @param {TilemapPhysicsOptions} [options] Rules selecting solids, sensors, and one-way cells.
   * @returns {void}
   */
  public constructor(map: Tilemap, world: PhysicsWorld, options: TilemapPhysicsOptions = {}) {
    this.map = map; this.world = world; this.options = Object.freeze({ ...options });
    this.refresh();
    this.cleanups.push(map.tiles.effect(() => this.refresh()), map.dimensions.position.effect(() => this.refresh()), map.dimensions.scale.effect(() => this.refresh()));
  }

  /**
   * Rebuilds owned geometry atomically after validation; call explicitly if external rule data changes.
   * Zero-scaled maps produce no colliders until their scale becomes nonzero again.
   * @returns {void}
   */
  public refresh(): void {
    if (this.disposed()) return;
    if (this.refreshing()) { this.refreshPending.set(true); return; }
    this.refreshing.set(true);
    try {
      do {
        this.refreshPending.set(false);
        this.rebuild();
      } while (this.refreshPending() && !this.disposed());
    } finally { this.refreshing.set(false); }
  }

  /**
   * Constructs a complete validated replacement before releasing the previous collider set.
   * @returns {void}
   * @private
   */
  private rebuild(): void {
    const next: RigidBody2D[] = [];
    for (let y = 0; y < this.map.mapHeight; y++) for (let x = 0; x < this.map.mapWidth; x++) {
      const tile = this.map.getTile(x, y);
      if (!(this.options.isSolid?.(tile, x, y) ?? tile > 0)) continue;
      const bounds = this.map.getCellBounds(x, y);
      if (!bounds.width || !bounds.height) continue;
      next.push(new RigidBody2D({
        type: 'static', x: bounds.x + bounds.width / 2, y: bounds.y + bounds.height / 2,
        shape: { kind: 'box', width: bounds.width, height: bounds.height },
        oneWay: this.options.isOneWay?.(tile, x, y) ?? false, sensor: this.options.isSensor?.(tile, x, y) ?? false,
        layer: this.options.layer, mask: this.options.mask
      }));
    }
    for (const body of this.bodies()) this.world.removeBody(body);
    if (this.disposed()) return;
    for (const body of next) this.world.addBody(body);
    this.bodies.set(Object.freeze(next));
  }

  /**
   * Removes only this adapter's bodies and unsubscribes from future map changes.
   * @returns {void}
   */
  public dispose(): void {
    if (this.disposed()) return;
    this.disposed.set(true);
    for (const cleanup of this.cleanups.splice(0)) cleanup();
    for (const body of this.bodies()) this.world.removeBody(body);
    this.bodies.set([]);
  }
}
