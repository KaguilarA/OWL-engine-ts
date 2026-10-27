import { signalValue, type SignalValue } from 'reactive-values';
import { GameLoader, Sprite } from '../../engine';

/**
 * A roaming crystal spirit that guards the citadel's exit.
 * @class MoonWisp
 */
export default class MoonWisp {
  /**
   * Left edge of the spirit's patrol range.
   * @property {number} minimumX
   * @private
   * @readonly
   */
  private readonly minimumX: number;

  /**
   * Right edge of the spirit's patrol range.
   * @property {number} maximumX
   * @private
   * @readonly
   */
  private readonly maximumX: number;

  /**
   * Initial horizontal position restored by a restart.
   * @property {number} initialX
   * @private
   * @readonly
   */
  private readonly initialX: number;

  /**
   * Maximum health restored by a restart.
   * @property {number} maximumHealth
   * @private
   * @readonly
   */
  private readonly maximumHealth: number;

  /**
   * Existing phantom enemy atlas used for the spirit's idle animation.
   * @property {Sprite} sprite
   * @private
   * @readonly
   */
  private readonly sprite: Sprite;

  /**
   * Current horizontal world position.
   * @property {SignalValue<number>} x
   * @public
   * @readonly
   */
  public readonly x: SignalValue<number>;

  /**
   * Remaining spirit health.
   * @property {SignalValue<number>} health
   * @public
   * @readonly
   */
  public readonly health: SignalValue<number>;

  /**
   * Current patrol direction.
   * @property {SignalValue<number>} direction
   * @private
   * @readonly
   */
  private readonly direction: SignalValue<number> = signalValue(1);

  /**
   * Creates a spirit with a patrol range and health pool.
   * @param startX Initial horizontal position.
   * @param minimumX Left patrol limit.
   * @param maximumX Right patrol limit.
   * @param health Initial and maximum health.
   * @public
   * @return {void}
   */
  public constructor(
    startX: number,
    minimumX: number,
    maximumX: number,
    health: number
  ) {
    if (![startX, minimumX, maximumX, health].every(Number.isFinite)
      || minimumX > startX || startX > maximumX || health <= 0) {
      throw new RangeError('Moon wisp requires an ordered patrol range and positive finite health.');
    }
    this.initialX = startX;
    this.minimumX = minimumX;
    this.maximumX = maximumX;
    this.maximumHealth = health;
    this.x = signalValue(startX);
    this.health = signalValue(health);
    this.sprite = new Sprite(GameLoader.getImage('phantommorph'), 64, 64, 0, 0, 0.5, 0.5);
    this.sprite.playAtlasClip(GameLoader.getAtlas('phantommorph').getAnimation('idle'));
  }

  /**
   * Restores the spirit's starting position, direction, and health.
   * @public
   * @return {void}
   */
  public reset(): void {
    this.x.set(this.initialX);
    this.health.set(this.maximumHealth);
    this.direction.set(1);
  }

  /**
   * Reports whether the spirit remains in the fight.
   * @public
   * @return {boolean}
   */
  public get isAlive(): boolean {
    return this.health() > 0;
  }

  /**
   * Moves the spirit back and forth inside its patrol range.
   * @param deltaSeconds Duration of the frame in seconds.
   * @public
   * @return {void}
   */
  public update(deltaSeconds: number): void {
    if (!this.isAlive) return;
    this.sprite.update(deltaSeconds);
    let nextX = this.x() + this.direction() * 54 * deltaSeconds;
    if (nextX <= this.minimumX || nextX >= this.maximumX) {
      this.direction.set(-this.direction());
      nextX = Math.max(this.minimumX, Math.min(this.maximumX, nextX));
    }
    this.x.set(nextX);
  }

  /**
   * Applies incoming damage and reports whether the spirit was defeated.
   * @param damage Damage to apply.
   * @public
   * @return {boolean} Whether the spirit has been defeated.
   */
  public takeDamage(damage: number): boolean {
    if (!Number.isFinite(damage) || damage < 0) {
      throw new RangeError('Moon wisp damage must be finite and non-negative.');
    }
    this.health.set(Math.max(0, this.health() - damage));
    return !this.isAlive;
  }

  /**
   * Draws the animated phantom at a screen position and requested size.
   * @param screenX Horizontal screen coordinate.
   * @param screenY Vertical screen coordinate.
   * @param size Rendered width and height.
   * @public
   * @return {void}
   */
  public drawAt(screenX: number, screenY: number, size: number): void {
    if (!this.isAlive) return;
    this.sprite.dimensions.setSize(size, size);
    this.sprite.dimensions.setPosition(screenX, screenY);
    this.sprite.draw();
  }
}
