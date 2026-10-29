import type { ReelBankOptions, ReelSymbolVisual } from '../interfaces';

import { Reel, ReelIcon, ReelAnimationProfile } from './';

/**
 * Shared slot reel collection: symbol strips, spin plans, fast stops, and settling.
 * @class ReelBank
 */
export default class {
  /**
   * Reels configuration or state owned by ReelBank.
   * @property {Reel[]} reels
   * @readonly
   * @public
   */
  public readonly reels: Reel[];
  /**
   * Icons configuration or state owned by ReelBank.
   * @property {ReelIcon[][]} icons
   * @readonly
   * @public
   */
  public readonly icons: ReelIcon[][];
  /**
   * Visuals configuration or state owned by ReelBank.
   * @property {(ReelSymbolVisual | undefined)[][]} visuals
   * @readonly
   * @public
   */
  public readonly visuals: Array<Array<ReelSymbolVisual | undefined>>;
  /**
   * Row count configuration or state owned by ReelBank.
   * @property {number} rowCount
   * @readonly
   * @private
   */
  private readonly rowCount: number;
  /**
   * Random symbol configuration or state owned by ReelBank.
   * @property {() => string} randomSymbol
   * @readonly
   * @private
   */
  private readonly randomSymbol: () => string;
  /**
   * Spin speed multiplier configuration or state owned by ReelBank.
   * @property {number} spinSpeedMultiplier
   * @readonly
   * @private
   */
  private readonly spinSpeedMultiplier: number;

  /**
   * Initializes ReelBank and its owned resources from the supplied arguments.
   * @constructor
   * @param {ReelBankOptions} options Configuration controlling construction or behavior.
   * @returns {void}
   * @public
   */
  public constructor(options: ReelBankOptions) {
    if (!Number.isInteger(options.reelCount) || options.reelCount < 1) {
      throw new RangeError('reelCount must be a positive integer.');
    }
    if (!Number.isInteger(options.rowCount) || options.rowCount < 1) {
      throw new RangeError('rowCount must be a positive integer.');
    }
    const speed = options.spinSpeedMultiplier ?? 1;
    if (!Number.isFinite(speed) || speed <= 0) {
      throw new RangeError('spinSpeedMultiplier must be a positive finite number.');
    }

    this.rowCount = options.rowCount;
    this.randomSymbol = options.randomSymbol;
    this.spinSpeedMultiplier = speed;
    const reelOptions = ReelAnimationProfile.createOptions(this.rowCount);
    this.reels = Array.from({ length: options.reelCount }, () => new Reel(
      this.randomColumn(), this.randomSymbol, reelOptions
    ));
    this.visuals = this.reels.map((_, reelIndex) => Array.from(
      { length: this.rowCount + 2 },
      (_unused, iconIndex) => options.createVisual?.(reelIndex, iconIndex)
    ));
    this.icons = this.reels.map((reel, reelIndex) => {
      const icons = this.visuals[reelIndex].map((visual) => {
        const icon = new ReelIcon(visual !== undefined);
        if (visual) icon.setPresentation(visual, 0, false);
        reel.add(icon);
        return icon;
      });
      return icons;
    });
  }

  /**
   * Returns is settled from the current ReelBank state.
   * @returns {boolean} is settled from the current ReelBank state.
   * @public
   */
  public get isSettled(): boolean {
    return this.reels.every((reel) => !reel.isActive());
  }

  /**
   * Advances ReelBank simulation and dependent presentation state for one frame.
   * @param {number} deltaSeconds Elapsed simulation time in seconds.
   * @returns {boolean} Advances ReelBank simulation and dependent presentation state for one frame.
   * @public
   */
  public update(deltaSeconds: number): boolean {
    this.reels.forEach((reel) => reel.update(deltaSeconds));
    return this.isSettled;
  }

  /**
   * Starts spin for ReelBank.
   * @returns {void}
   * @public
   */
  public startSpin(): void {
    this.reels.forEach((reel, index) => {
      const plan = ReelAnimationProfile.getSpinPlan(index);
      reel.startSpin(this.randomColumn(), plan.travelCells, plan.duration / this.spinSpeedMultiplier);
    });
  }

  /**
   * Applies the request fast stop operation to ReelBank.
   * @returns {void}
   * @public
   */
  public requestFastStop(): void {
    this.reels.forEach((reel) => reel.requestFastStop());
  }

  /**
   * Resets reel bank for ReelBank.
   * @returns {void}
   * @public
   */
  public reset(): void {
    this.reels.forEach((reel) => reel.reset(this.randomColumn()));
  }

  /**
   * Returns columns for ReelBank.
   * @returns {string[][]} columns for ReelBank.
   * @public
   */
  public getColumns(): string[][] {
    return this.reels.map((reel) => reel.symbols());
  }

  /**
   * Applies the random column operation to ReelBank.
   * @returns {string[]} Applies the random column operation to ReelBank.
   * @private
   */
  private randomColumn(): string[] {
    return Array.from({ length: this.rowCount }, this.randomSymbol);
  }
}
