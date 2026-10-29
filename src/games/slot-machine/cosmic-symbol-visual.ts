import { signalValue, type SignalValue } from 'reactive-values';
import {
  GameContext,
  Sprite,
  type ReelSymbolVisual
} from '../../engine';

import type { CosmicSymbolAsset } from './interfaces';

/**
 * Keeps per-cell atlas playback while reusing Cosmic Jackpot's own symbols.
 * @class CosmicSymbolVisual
 */
export default class implements ReelSymbolVisual {
  /**
   * Reactive symbol state owned by CosmicSymbolVisual.
   * @property {SignalValue<string>} symbol
   * @readonly
   * @private
   */
  private readonly symbol: SignalValue<string> = signalValue('');
  /**
   * Reactive winning state owned by CosmicSymbolVisual.
   * @property {SignalValue<boolean>} winning
   * @readonly
   * @private
   */
  private readonly winning: SignalValue<boolean> = signalValue(false);
  /**
   * Assets configuration or state owned by CosmicSymbolVisual.
   * @property {ReadonlyMap<string, CosmicSymbolAsset>} assets
   * @readonly
   * @private
   */
  private readonly assets: ReadonlyMap<string, CosmicSymbolAsset>;
  /**
   * Sprites configuration or state owned by CosmicSymbolVisual.
   * @property {Map<string, Sprite>} sprites
   * @readonly
   * @private
   */
  private readonly sprites = new Map<string, Sprite>();

  /**
   * Initializes CosmicSymbolVisual and its owned resources from the supplied arguments.
   * @constructor
   * @param {ReadonlyMap<string, CosmicSymbolAsset>} assets The assets supplied to this operation.
   * @returns {void}
   * @public
   */
  public constructor(assets: ReadonlyMap<string, CosmicSymbolAsset>) {
    this.assets = assets;
  }

  /**
   * Updates symbol for CosmicSymbolVisual.
   * @param {string} symbol The symbol supplied to this operation.
   * @returns {void}
   * @public
   */
  public setSymbol(symbol: string): void {
    if (this.symbol() === symbol) return;
    this.symbol.set(symbol);
    if (this.winning()) this.restartSelectedAnimation();
  }

  /**
   * Updates winning for CosmicSymbolVisual.
   * @param {boolean} isWinning The is winning supplied to this operation.
   * @returns {void}
   * @public
   */
  public setWinning(isWinning: boolean): void {
    if (this.winning() === isWinning) return;
    this.winning.set(isWinning);
    this.restartSelectedAnimation();
  }

  /**
   * Advances CosmicSymbolVisual simulation and dependent presentation state for one frame.
   * @param {number} deltaSeconds Elapsed simulation time in seconds.
   * @param {boolean} [isWinning] The is winning supplied to this operation.
   * @returns {void}
   * @public
   */
  public update(deltaSeconds: number, isWinning = false): void {
    if (!isWinning) return;
    this.getSprite()?.update(deltaSeconds);
  }

  /**
   * Renders CosmicSymbolVisual using its current geometry and presentation state.
   * @param {number} centerX The center x supplied to this operation.
   * @param {number} centerY The center y supplied to this operation.
   * @param {number} width Width of the represented area.
   * @param {number} height Height of the represented area.
   * @param {number} [blurAmount] The blur amount supplied to this operation.
   * @returns {void}
   * @public
   */
  public draw(
    centerX: number,
    centerY: number,
    width: number,
    height: number,
    blurAmount = 0
  ): void {
    const sprite = this.getSprite();
    if (!sprite) return;
    sprite.dimensions.setPosition(centerX, centerY);
    sprite.dimensions.setSize(width, height);

    const context = GameContext.context;
    context.save();
    context.filter = blurAmount > 0
      ? `blur(${Math.min(width, height) * 0.035 * blurAmount}px)`
      : 'none';
    try {
      sprite.draw();
    } finally {
      context.restore();
    }
  }

  /**
   * Returns sprite for CosmicSymbolVisual.
   * @returns {Sprite | undefined} sprite for CosmicSymbolVisual.
   * @private
   */
  private getSprite(): Sprite | undefined {
    const name = this.symbol();
    if (!name) return undefined;
    const cached = this.sprites.get(name);
    if (cached) return cached;
    const asset = this.assets.get(name);
    if (!asset) return undefined;
    const sprite = new Sprite(asset.image, 80, 80, 0, 0, 0.5, 0.5);
    sprite.playAtlasClip(asset.idleAnimation);
    this.sprites.set(name, sprite);
    return sprite;
  }

  /**
   * Restarts selected animation for CosmicSymbolVisual.
   * @returns {void}
   * @private
   */
  private restartSelectedAnimation(): void {
    const name = this.symbol();
    const sprite = this.sprites.get(name);
    const asset = this.assets.get(name);
    if (sprite && asset) sprite.playAtlasClip(asset.idleAnimation);
  }
}
