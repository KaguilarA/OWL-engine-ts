import { signalValue } from 'reactive-values';
import {
  Collision2D,
  GameLoader,
  Health,
  Sprite,
  SpriteEntity,
} from '../../engine';

import type { BossShotOrigin } from './interfaces';

/**
 * Available boss encounters, each with its own health and attack phases.
 */
export type BossType = 1 | 2 | 3;

/**
 * A boss with a distinct movement, vulnerability, and attack pattern.
 * @class Boss
 */
export default class extends SpriteEntity {
  /**
   * Stores the health state.
   * @property {Health} health
   * @private
   * @readonly
   */
  private readonly health: Health;
  /**
   * Stores the elapsed state.
   * @property {number} elapsed
   * @private
   */
  private elapsed = 0;
  /**
   * Stores the direction state.
   * @property {number} direction
   * @private
   */
  private direction = 1;
  /**
   * Stores the destruction playing state.
   * @property {boolean} destructionPlaying
   * @private
   */
  private destructionPlaying = false;
  /**
   * Named atlas clip associated with this boss type.
   * @property {string} atlasClipName
   * @private
   * @readonly
   */
  private readonly atlasClipName: string;

  /**
   * Stores the type state.
   * @property {BossType} type
   * @public
   * @readonly
   */
  public readonly type: BossType;
  /**
   * Stores the is alive state.
   * @property {boolean} isAlive
   * @public
   */
  private readonly aliveState = signalValue(true);
  /**
   * Returns is alive from the current Boss state.
   * @returns {boolean} is alive from the current Boss state.
   * @public
   */
  public get isAlive(): boolean { return this.aliveState(); }
  /**
   * Updates is alive in the Boss state.
   * @param {boolean} value Value to read, validate, format, or assign.
   * @returns {void}
   * @public
   */
  public set isAlive(value: boolean) { this.aliveState.set(value); }

  /**
   * Returns the score awarded when this boss is defeated.
   * @public
   * @return {number}
   */
  public get points(): number {
    return this.health.maximum * 25;
  }

  /**
   * Returns the display name for the selected boss type.
   * @public
   * @return {string}
   */
  public get name(): string {
    if (this.type === 1) return 'HIVE MOTHER';
    if (this.type === 2) return 'AEGIS CORE';
    return 'VOID EMPRESS';
  }

  /**
   * Returns remaining health as a value from zero to one.
   * @public
   * @return {number}
   */
  public get healthRatio(): number {
    return this.health.current / this.health.maximum;
  }

  /**
   * Reports whether the boss can currently take projectile damage.
   * @public
   * @return {boolean}
   */
  public get isVulnerable(): boolean {
    if (!this.isAlive || this.health.isDepleted) return false;

    if (this.type === 2) {
      return Math.floor(this.elapsed / 2) % 2 === 0;
    }

    if (this.type === 3) {
      return this.elapsed % 3 >= 1.2;
    }

    return true;
  }

  /**
   * Reports whether the boss's timed shield is currently active.
   * @public
   * @return {boolean}
   */
  public get isShielded(): boolean {
    return this.type === 2 && !this.isVulnerable;
  }

  /**
   * Creates a boss with type-specific health, movement, and animations.
   * @public
   * @return {void}
   * @constructor
   * @param {BossType} type Component constructor used to select a matching component.
   * @param {number} x Horizontal coordinate in the owning coordinate space.
   * @param {number} y Vertical coordinate in the owning coordinate space.
   * @param {number | undefined} [width] Width of the represented area.
   * @param {number | undefined} [height] Height of the represented area.
   */
  constructor(
    type: BossType,
    x: number,
    y: number,
    width?: number,
    height?: number
  ) {
    const imageName = 'boss8';
    const atlas = GameLoader.getAtlas(imageName);
    const atlasClipName = type === 1
      ? 'boss-hive-mother'
      : type === 2
        ? 'boss-aegis-core'
        : 'boss-void-empress';
    const defaultWidth = type === 1 ? 190 : 180;
    const defaultHeight = defaultWidth;

    super(new Sprite(
      GameLoader.getImage(imageName),
      width ?? defaultWidth,
      height ?? defaultHeight,
      x,
      y,
      0.5,
      0.5
    ));
    this.type = type;
    this.atlasClipName = atlasClipName;
    this.health = new Health(type === 1 ? 12 : type === 2 ? 18 : 24);
    this.sprite.playAtlasClip(atlas.getAnimation(atlasClipName));
  }

  /**
   * Advances boss movement, vulnerability phases, and defeat animation.
   * @public
   * @return {void}
   * @param {number} deltaSeconds Elapsed simulation time in seconds.
   * @param {number} gameWidth The game width supplied to this operation.
   */
  public update(deltaSeconds: number, gameWidth: number): void {
    if (!this.isAlive) return;

    this.elapsed += deltaSeconds;
    this.updateSprite(deltaSeconds);

    if (this.destructionPlaying && !this.sprite.isAnimationPlaying) {
      this.isAlive = false;
      return;
    }

    if (this.destructionPlaying) return;

    const speed = this.type === 3 ? 180 : this.type === 2 ? 90 : 125;
    let velocityX = this.direction * speed;
    let nextX = this.x + velocityX * deltaSeconds;

    if (nextX - this.width * 0.5 <= 24) {
      this.direction = 1;
      nextX = this.width * 0.5 + 24;
      velocityX = 0;
    } else if (nextX + this.width * 0.5 >= gameWidth - 24) {
      this.direction = -1;
      nextX = gameWidth - this.width * 0.5 - 24;
      velocityX = 0;
    }

    const nextY = this.type === 3
      ? 220 + Math.sin(this.elapsed * 2.5) * 70
      : this.y;
    const velocityY = deltaSeconds > 0
      ? (nextY - this.y) / deltaSeconds
      : 0;
    if (velocityX === 0) this.setPosition(nextX, this.y);
    this.advanceMovement(deltaSeconds, velocityX, velocityY);
  }

  /**
   * Renders Boss using its current geometry and presentation state.
   * @returns {void}
   * @public
   */
  public override draw(): void {
    if (this.isAlive) {
      this.sprite.draw();
    }
  }

  /**
   * Applies a rectangular hit if the boss is currently vulnerable.
   * @public
   * @return {boolean} Whether the hit damaged the boss.
   * @param {number} x Horizontal coordinate in the owning coordinate space.
   * @param {number} y Vertical coordinate in the owning coordinate space.
   * @param {number} width Width of the represented area.
   * @param {number} height Height of the represented area.
   */
  public hit(
    x: number,
    y: number,
    width: number,
    height: number
  ): boolean {
    if (!this.isVulnerable) return false;

    const intersects = Collision2D.overlapsRectangles(
      x, y, width, height,
      this.sprite.dimensions.left(), this.sprite.dimensions.top(),
      this.sprite.dimensions.getWidth(), this.sprite.dimensions.getHeight()
    );

    if (!intersects) return false;

    const damage = this.health.receiveDamage();

    if (!damage.wasDamaged) return false;

    if (damage.isDepleted) {
      this.destructionPlaying = true;
      this.sprite.playAtlasClip(
        GameLoader.getAtlas('boss8').getAnimation(
          `explosion-${this.atlasClipName.slice(5)}`
        )
      );
    }

    return damage.wasDamaged;
  }

  /**
   * Returns projectile origins for the boss's configured attack pattern.
   * @public
   * @return {BossShotOrigin[]}
   */
  public getShotOrigins(): BossShotOrigin[] {
    if (this.type === 2) {
      return [
        { x: this.x - this.width * 0.35, y: this.y + this.height * 0.4 },
        { x: this.x, y: this.y + this.height * 0.4 },
        { x: this.x + this.width * 0.35, y: this.y + this.height * 0.4 }
      ];
    }

    if (this.type === 3) {
      return [
        { x: this.x - this.width * 0.4, y: this.y + this.height * 0.4 },
        { x: this.x + this.width * 0.4, y: this.y + this.height * 0.4 }
      ];
    }

    return [{ x: this.x, y: this.y + this.height * 0.4 }];
  }
}
