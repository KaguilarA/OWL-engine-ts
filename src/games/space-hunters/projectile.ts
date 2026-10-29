import { signalValue } from 'reactive-values';
import {
  GameContext,
  GameLoader,
  Sprite,
  SpriteEntity
} from '../../engine';

/**
 * Pooled animated projectile that travels vertically through the playfield.
 * @class Projectile
 */
export default class extends SpriteEntity {
  /**
   * Stores the direction state.
   * @property {number} direction
   * @private
   */
  private direction = -1;
  /**
   * Stores the speed state.
   * @property {number} speed
   * @private
   * @readonly
   */
  private readonly speed = 620;

  /**
   * Stores the is free state.
   * @property {Signal} isFree
   * @public
   * @readonly
   */
  public readonly isFree = signalValue(true);

  /**
   * Creates an inactive projectile using the shared animated bullet sheet.
   * @public
   * @return {void}
   * @constructor
   */
  public constructor() {
    const atlas = GameLoader.getAtlas('enemyProjectile');
    super(new Sprite(
      GameLoader.getImage('enemyProjectile'),
      14,
      28
    ));
    this.sprite.playAtlasClip(atlas.getAnimation('idle'));
  }

  /**
   * Renders Projectile using its current geometry and presentation state.
   * @returns {void}
   * @public
   */
  public override draw(): void {
    if (!this.isFree()) {
      super.draw();
    }
  }

  /**
   * Activates the projectile at a position and vertical direction.
   * @public
   * @return {void}
   * @param {number} x Horizontal coordinate in the owning coordinate space.
   * @param {number} y Vertical coordinate in the owning coordinate space.
   * @param {number} [direction] The direction supplied to this operation.
   */
  public start(x: number, y: number, direction = -1): void {
    this.direction = direction;
    this.setPosition(
      x - this.width * 0.5,
      y
    );
    this.isFree.set(false);
  }

  /**
   * Returns the projectile to the inactive pool.
   * @public
   * @return {void}
   */
  public stop(): void {
    this.isFree.set(true);
  }

  /**
   * Moves the projectile and releases it after leaving the viewport.
   * @public
   * @return {void}
   * @param {number} deltaSeconds Elapsed simulation time in seconds.
   */
  public update(deltaSeconds: number): void {
    if (this.isFree()) return;

    this.sprite.update(deltaSeconds);
    this.advanceMovement(deltaSeconds, 0, this.speed * this.direction);
    const gameHeight = GameContext.gameDimensionsModel.getHeight();

    if (this.y < -this.height || this.y > gameHeight + this.height) {
      this.stop();
    }
  }
}
