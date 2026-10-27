import { computedValue, signalValue, type ComputedValue, type SignalValue } from 'reactive-values';

/**
 * Tracks in-game casino credits and a single active wager.
 * @class CasinoBankroll
 */
export default class CasinoBankroll {
  /**
   * Available in-game credits.
   * @property {SignalValue<number>} credits
   * @public
   * @readonly
   */
  public readonly credits: SignalValue<number>;

  /**
   * Amount currently committed to the active wager.
   * @property {SignalValue<number>} wager
   * @public
   * @readonly
   */
  public readonly wager: SignalValue<number> = signalValue(0);

  /**
   * Whether a wager is active.
   * @property {ComputedValue<boolean>} hasWager
   * @public
   * @readonly
   */
  public readonly hasWager: ComputedValue<boolean> = computedValue(() => this.wager() > 0, [this.wager]);

  /**
   * Creates a bankroll with the starting number of in-game credits.
   * @param startingCredits Initial credit balance.
   * @public
   * @return {void}
   */
  public constructor(startingCredits: number) {
    this.assertAmount(startingCredits, 'Starting credits', true);
    this.credits = signalValue(startingCredits);
  }

  /**
   * Reserves credits for a wager if the player can afford it.
   * @param amount Wager amount.
   * @public
   * @return {boolean} Whether the wager was accepted.
   */
  public placeWager(amount: number): boolean {
    this.assertAmount(amount, 'Wager', false);
    if (this.hasWager() || amount > this.credits()) return false;
    this.credits.set(this.credits() - amount);
    this.wager.set(amount);
    return true;
  }

  /**
   * Settles the active wager and credits its gross payout.
   * @param multiplier Gross payout multiplier, including returned stake.
   * @public
   * @return {number} Credits paid to the bankroll.
   */
  public settle(multiplier: number): number {
    if (!Number.isFinite(multiplier) || multiplier < 0) {
      throw new RangeError('Payout multiplier must be finite and non-negative.');
    }
    const payout = this.wager() * multiplier;
    this.credits.set(this.credits() + payout);
    this.wager.set(0);
    return payout;
  }

  /**
   * Returns an active wager to the available balance.
   * @public
   * @return {number} Refunded credits.
   */
  public refund(): number {
    const amount = this.wager();
    this.credits.set(this.credits() + amount);
    this.wager.set(0);
    return amount;
  }

  /**
   * Adds in-game credits to the bankroll.
   * @param amount Credits to add.
   * @public
   * @return {void}
   */
  public addCredits(amount: number): void {
    this.assertAmount(amount, 'Credit addition', true);
    this.credits.set(this.credits() + amount);
  }

  /**
   * Validates a finite non-negative amount and optionally requires a positive value.
   * @param amount Amount to validate.
   * @param label Description used in the error.
   * @param allowZero Whether zero is accepted.
   * @private
   * @return {void}
   */
  private assertAmount(amount: number, label: string, allowZero: boolean): void {
    if (!Number.isFinite(amount) || (allowZero ? amount < 0 : amount <= 0)) {
      throw new RangeError(`${label} must be ${allowZero ? 'non-negative' : 'positive'} and finite.`);
    }
  }
}
