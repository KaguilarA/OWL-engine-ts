import type { DamageableSpriteEntityOptions } from '../interfaces';
import { signalValue } from 'reactive-values';

import { Collision2D, Health } from '../core';
import { Sprite } from '../animations/sprites';
import { SpriteEntity } from './';

/**
 * Shares health, hit testing, defeat timing, and animation lifecycle for sprite entities.
 * @class DamageableSpriteEntity
 */
export default class extends SpriteEntity {
  /**
   * Health configuration or state owned by DamageableSpriteEntity.
   * @property {default} health
   * @readonly
   * @private
   */
  private readonly health: Health;
  /**
   * Points configuration or state owned by DamageableSpriteEntity.
   * @property {number} points
   * @readonly
   * @public
   */
  public readonly points: number;
  /**
   * Configuration controlling construction or behavior.
   * @property {DamageableSpriteEntityOptions} options
   * @readonly
   * @private
   */
  private readonly options: DamageableSpriteEntityOptions;
  /**
   * Reactive alive state owned by DamageableSpriteEntity.
   * @property {SignalValue<boolean> & (() => boolean)} alive
   * @readonly
   * @private
   */
  private readonly alive = signalValue(true);
  /**
   * Reactive impacting state owned by DamageableSpriteEntity.
   * @property {SignalValue<boolean> & (() => boolean)} impacting
   * @readonly
   * @private
   */
  private readonly impacting = signalValue(false);

  /**
   * Initializes DamageableSpriteEntity and its owned resources from the supplied arguments.
   * @constructor
   * @param {Sprite} sprite The sprite supplied to this operation.
   * @param {number} points The points supplied to this operation.
   * @param {number} [maximumHealth] The maximum health supplied to this operation.
   * @param {DamageableSpriteEntityOptions} [options] Configuration controlling construction or behavior.
   * @returns {void}
   * @public
   */
  public constructor(
    sprite: Sprite,
    points: number,
    maximumHealth = 1,
    options: DamageableSpriteEntityOptions = {}
  ) {
    super(sprite);
    this.points = points;
    this.health = new Health(maximumHealth);
    this.options = options;
  }

  /**
   * Returns is alive from the current DamageableSpriteEntity state.
   * @returns {boolean} is alive from the current DamageableSpriteEntity state.
   * @public
   */
  public get isAlive(): boolean {
    return this.alive();
  }

  /**
   * Returns is defeated from the current DamageableSpriteEntity state.
   * @returns {boolean} is defeated from the current DamageableSpriteEntity state.
   * @public
   */
  public get isDefeated(): boolean {
    return this.health.isDepleted;
  }

  /**
   * Renders DamageableSpriteEntity using its current geometry and presentation state.
   * @returns {void}
   * @public
   */
  public override draw(): void {
    if (this.isAlive) super.draw();
  }

  /**
   * Advances DamageableSpriteEntity simulation and dependent presentation state for one frame.
   * @param {number} deltaSeconds Elapsed simulation time in seconds.
   * @returns {void}
   * @public
   */
  public update(deltaSeconds: number): void {
    this.updateSprite(deltaSeconds);
    if (this.impacting() && !this.spriteIsAnimating()) {
      this.impacting.set(false);
      this.alive.set(false);
    }
  }

  /**
   * Applies one hit when the supplied rectangle overlaps this entity.
   * @param {number} x
   * @param {number} y
   * @param {number} width Available width in logical canvas coordinates.
   * @param {number} height Available height in logical canvas coordinates.
   * @returns {boolean}
   * @public
   */
  public hit(x: number, y: number, width: number, height: number): boolean {
    if (!this.isAlive || this.health.isDepleted) return false;

    const intersects = Collision2D.overlapsRectangles(
      x, y, width, height,
      this.dimensions.left(), this.dimensions.top(),
      this.dimensions.getWidth(), this.dimensions.getHeight()
    );
    if (!intersects) return false;

    const damage = this.health.receiveDamage();
    if (!damage.wasDamaged) return false;
    const damageTaken = this.health.maximum - this.health.current;
    if (damage.isDepleted) {
      this.impacting.set(true);
      this.options.onDefeated?.();
    } else {
      this.options.onDamaged?.(damageTaken);
    }
    return true;
  }

  /**
   * Applies the sprite is animating operation to DamageableSpriteEntity.
   * @returns {boolean} Applies the sprite is animating operation to DamageableSpriteEntity.
   * @private
   */
  private spriteIsAnimating(): boolean {
    return this.sprite.isAnimationPlaying;
  }
}
