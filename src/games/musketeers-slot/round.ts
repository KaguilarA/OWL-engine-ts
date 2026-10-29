import { signalValue, type SignalValue } from 'reactive-values';
import { ReelBank } from '../../engine';

import { evaluatePaylines, type MusketeersSlotAssets } from './';

/**
 * Shared values used to configure round.
 * @constant
 */
export const MUSKETEERS_REEL_COUNT = 5;
/**
 * Shared values used to configure round.
 * @constant
 */
export const MUSKETEERS_ROW_COUNT = 3;

/**
 * Owns round state and spin transitions independently from game presentation.
 * @class MusketeersSlotRound
 */
export default class {
  /**
   * Reactive balance state owned by MusketeersSlotRound.
   * @property {SignalValue<number>} balance
   * @readonly
   * @public
   */
  public readonly balance: SignalValue<number> = signalValue(1000);
  /**
   * Reactive bet state owned by MusketeersSlotRound.
   * @property {SignalValue<number>} bet
   * @readonly
   * @public
   */
  public readonly bet: SignalValue<number> = signalValue(10);
  /**
   * Reactive win state owned by MusketeersSlotRound.
   * @property {SignalValue<number>} win
   * @readonly
   * @public
   */
  public readonly win: SignalValue<number> = signalValue(0);
  /**
   * Reactive free spins state owned by MusketeersSlotRound.
   * @property {SignalValue<number>} freeSpins
   * @readonly
   * @public
   */
  public readonly freeSpins: SignalValue<number> = signalValue(0);
  /**
   * Reactive spinning state owned by MusketeersSlotRound.
   * @property {SignalValue<boolean>} spinning
   * @readonly
   * @public
   */
  public readonly spinning: SignalValue<boolean> = signalValue(false);
  /**
   * Reactive stop requested state owned by MusketeersSlotRound.
   * @property {SignalValue<boolean>} stopRequested
   * @readonly
   * @public
   */
  public readonly stopRequested: SignalValue<boolean> = signalValue(false);
  /**
   * Reactive winning cells state owned by MusketeersSlotRound.
   * @property {SignalValue<ReadonlySet<string>>} winningCells
   * @readonly
   * @public
   */
  public readonly winningCells: SignalValue<ReadonlySet<string>> = signalValue<ReadonlySet<string>>(new Set<string>());
  /**
   * Reel bank configuration or state owned by MusketeersSlotRound.
   * @property {ReelBank} reelBank
   * @readonly
   * @public
   */
  public readonly reelBank: ReelBank;
  /**
   * Symbols configuration or state owned by MusketeersSlotRound.
   * @property {string[]} symbols
   * @readonly
   * @private
   */
  private readonly symbols: string[];
  /**
   * Assets configuration or state owned by MusketeersSlotRound.
   * @property {MusketeersSlotAssets} assets
   * @readonly
   * @private
   */
  private readonly assets: MusketeersSlotAssets;

  /**
   * Initializes MusketeersSlotRound and its owned resources from the supplied arguments.
   * @constructor
   * @param {MusketeersSlotAssets} assets The assets supplied to this operation.
   * @returns {void}
   * @public
   */
  public constructor(assets: MusketeersSlotAssets) {
    this.assets = assets;
    this.symbols = Array.from(assets.symbols.keys());
    this.reelBank = new ReelBank({
      reelCount: MUSKETEERS_REEL_COUNT,
      rowCount: MUSKETEERS_ROW_COUNT,
      randomSymbol: () => this.randomSymbol(),
      spinSpeedMultiplier: 1.5
    });
  }

  /**
   * Advances MusketeersSlotRound simulation and dependent presentation state for one frame.
   * @param {number} deltaSeconds Elapsed simulation time in seconds.
   * @returns {void}
   * @public
   */
  public update(deltaSeconds: number): void {
    const settled = this.reelBank.update(deltaSeconds);
    this.assets.symbols.forEach((icon) => icon.update(deltaSeconds));
    if (this.spinning() && settled) this.resolveSpin();
  }

  /**
   * Restarts musketeers slot round for MusketeersSlotRound.
   * @returns {void}
   * @public
   */
  public restart(): void {
    this.balance.set(1000);
    this.bet.set(10);
    this.win.set(0);
    this.freeSpins.set(0);
    this.spinning.set(false);
    this.stopRequested.set(false);
    this.winningCells.set(new Set());
    this.assets.symbols.forEach((icon) => icon.resetWinAnimation());
    this.reelBank.reset();
  }

  /**
   * Spins musketeers slot round for MusketeersSlotRound.
   * @returns {void}
   * @public
   */
  public spin(): void {
    if (this.spinning()) {
      this.stopSpinQuickly();
      return;
    }
    if (this.balance() < this.bet() && this.freeSpins() === 0) return;
    if (this.freeSpins() > 0) this.freeSpins.set(this.freeSpins() - 1);
    else this.balance.set(this.balance() - this.bet());
    this.win.set(0);
    this.winningCells.set(new Set());
    this.assets.symbols.forEach((icon) => icon.resetWinAnimation());
    this.spinning.set(true);
    this.stopRequested.set(false);
    this.reelBank.startSpin();
  }

  /**
   * Stops spin quickly for MusketeersSlotRound.
   * @returns {void}
   * @private
   */
  private stopSpinQuickly(): void {
    if (this.stopRequested()) return;
    this.stopRequested.set(true);
    this.reelBank.requestFastStop();
  }

  /**
   * Resolves spin for MusketeersSlotRound.
   * @returns {void}
   * @private
   */
  private resolveSpin(): void {
    this.spinning.set(false);
    this.stopRequested.set(false);
    const result = evaluatePaylines(this.reelBank.getColumns(), this.bet());
    this.win.set(result.win);
    this.winningCells.set(result.winningCells);
    if (result.win > 0) this.balance.set(this.balance() + result.win);
  }

  /**
   * Selects a symbol using the game’s configured random selection rules.
   * @returns {string} Selects a symbol using the game’s configured random selection rules.
   * @private
   */
  private randomSymbol(): string {
    return this.symbols[Math.floor(Math.random() * this.symbols.length)] ?? '';
  }
}
