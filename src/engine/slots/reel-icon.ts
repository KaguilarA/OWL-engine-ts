import { signalValue, type SignalValue } from 'reactive-values';
import { Dimensions, GameContext, MathUtils } from '../core';
import type { Renderable, ReelSymbolVisual } from '../interfaces';

/**
 * Draws one independently positioned symbol inside its owning reel container.
 * @class ReelIcon
 */
export default class implements Renderable {
  /**
   * Dimensions configuration or state owned by ReelIcon.
   * @property {default} dimensions
   * @readonly
   * @public
   */
  public readonly dimensions = new Dimensions(0, 0, 0, 0, 0.5, 0.5);
  /**
   * Reactive icon state owned by ReelIcon.
   * @property {SignalValue<ReelSymbolVisual | undefined>} icon
   * @readonly
   * @private
   */
  private readonly icon: SignalValue<ReelSymbolVisual | undefined> = signalValue<ReelSymbolVisual | undefined>(undefined);
  /**
   * Reactive blur amount state owned by ReelIcon.
   * @property {SignalValue<number>} blurAmount
   * @readonly
   * @private
   */
  private readonly blurAmount: SignalValue<number> = signalValue(0);
  /**
   * Reactive winning state owned by ReelIcon.
   * @property {SignalValue<boolean>} winning
   * @readonly
   * @private
   */
  private readonly winning: SignalValue<boolean> = signalValue(false);
  /**
   * Updates visual configuration or state owned by ReelIcon.
   * @property {boolean} updatesVisual
   * @readonly
   * @private
   */
  private readonly updatesVisual: boolean;

  /**
   * Initializes ReelIcon and its owned resources from the supplied arguments.
   * @constructor
   * @param {boolean} [updatesVisual] The updates visual supplied to this operation.
   * @returns {void}
   * @public
   */
  public constructor(updatesVisual = true) {
    this.updatesVisual = updatesVisual;
  }

  /**
   * Updates presentation for ReelIcon.
   * @param {ReelSymbolVisual | undefined} icon The icon supplied to this operation.
   * @param {number} blurAmount The blur amount supplied to this operation.
   * @param {boolean} winning The winning supplied to this operation.
   * @param {string | undefined} [symbol] The symbol supplied to this operation.
   * @returns {void}
   * @public
   */
  public setPresentation(
    icon: ReelSymbolVisual | undefined,
    blurAmount: number,
    winning: boolean,
    symbol?: string
  ): void {
    const visualChanged = this.icon() !== icon;
    if (visualChanged) this.icon.set(icon);
    if (symbol !== undefined) icon?.setSymbol?.(symbol);
    const nextBlurAmount = MathUtils.clamp(blurAmount, 0, 1);
    if (this.blurAmount() !== nextBlurAmount) this.blurAmount.set(nextBlurAmount);
    if (visualChanged || this.winning() !== winning) {
      this.winning.set(winning);
      icon?.setWinning?.(winning);
    }
  }

  /**
   * Advances ReelIcon simulation and dependent presentation state for one frame.
   * @param {number} deltaSeconds Elapsed simulation time in seconds.
   * @returns {void}
   * @public
   */
  public update(deltaSeconds: number): void {
    if (this.updatesVisual) this.icon()?.update(deltaSeconds, this.winning());
  }

  /**
   * Renders ReelIcon using its current geometry and presentation state.
   * @returns {void}
   * @public
   */
  public draw(): void {
    const icon = this.icon();
    if (!icon) return;
    const x = this.dimensions.getX();
    const y = this.dimensions.getY();
    const width = this.dimensions.getWidth();
    const height = this.dimensions.getHeight();
    if (this.winning()) {
      const pulse = 0.78 + Math.sin(performance.now() / 150) * 0.08;
      GameContext.drawCircle(x, y, Math.min(width, height) * 0.43 * pulse, 'rgba(255,190,38,0.48)');
    }
    icon.draw(x, y, width, height, this.blurAmount(), this.winning());
  }
}
