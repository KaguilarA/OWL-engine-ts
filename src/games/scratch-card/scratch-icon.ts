import { signalValue } from 'reactive-values';
import { GameLoader, Sprite } from '../../engine';

/**
 * Owns one scratch-card symbol and its static or winning animation state.
 * @class ScratchIcon
 */
export default class {
  /**
   * Symbol configuration or state owned by ScratchIcon.
   * @property {string} symbol
   * @readonly
   * @public
   */
  public readonly symbol: string;

  /**
   * Sprite configuration or state owned by ScratchIcon.
   * @property {Sprite} sprite
   * @readonly
   * @private
   */
  private readonly sprite: Sprite;
  /**
   * Reactive winning state owned by ScratchIcon.
   * @property {SignalValue<boolean> & (() => boolean)} winning
   * @readonly
   * @private
   */
  private readonly winning = signalValue(false);

  /**
   * Initializes ScratchIcon and its owned resources from the supplied arguments.
   * @constructor
   * @param {string} symbol The symbol supplied to this operation.
   * @returns {void}
   * @public
   */
  public constructor(symbol: string) {
    this.symbol = symbol;
    this.sprite = new Sprite(GameLoader.getImage(symbol), 80, 80, 0, 0, 0.5, 0.5);
    this.sprite.playAtlasClip(GameLoader.getAtlas(symbol).getAnimation('idle'));
    this.sprite.setFrame(0);
  }

  /**
   * Enables or stops the sprite animation for this winning symbol.
   * @param {boolean} winning
   * @returns {void}
   * @public
   */
  public setWinning(winning: boolean): void {
    if (this.winning() === winning) return;
    this.winning.set(winning);
    const animation = GameLoader.getAtlas(this.symbol).getAnimation('idle');
    if (winning) this.sprite.playAtlasClip(animation);
    else {
      this.sprite.playAtlasClip(animation);
      this.sprite.setFrame(0);
    }
  }

  /**
   * Advances the symbol only while it belongs to a winning card.
   * @param {number} deltaSeconds Elapsed simulation time in seconds.
   * @returns {void}
   * @public
   */
  public update(deltaSeconds: number): void {
    if (this.winning()) this.sprite.update(deltaSeconds);
  }

  /**
   * Draws the symbol centered at the requested point.
   * @param {number} centerX
   * @param {number} centerY
   * @param {number} maxSize
   * @returns {void}
   * @public
   */
  public draw(centerX: number, centerY: number, maxSize: number): void {
    const size = Math.max(1, Math.min(70, maxSize));
    this.sprite.dimensions.setPosition(centerX, centerY);
    this.sprite.dimensions.setSize(size, size);
    this.sprite.draw();
  }
}
