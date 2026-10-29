import { signalValue, type SignalValue } from 'reactive-values';

/**
 * Reusable firing cadence and ammunition state for action and shooter games.
 * @class Weapon
 */
export default class {
  /**
   * Minimum seconds between shots.
   * @property {number} fireInterval
   * @public
   * @readonly
   */
  public readonly fireInterval: number;

  /**
   * Remaining ammunition, or `undefined` for an unlimited weapon.
   * @property {SignalValue<number | undefined>} ammunition
   * @public
   * @readonly
   */
  public readonly ammunition: SignalValue<number | undefined>;

  /**
   * Remaining time until the weapon can fire again.
   * @property {SignalValue<number>} cooldownRemaining
   * @public
   * @readonly
   */
  public readonly cooldownRemaining: SignalValue<number> = signalValue(0);

  /**
   * Creates a weapon with a fire interval and optional ammunition capacity.
   * @param fireInterval Minimum seconds between shots.
   * @param ammunition Initial ammunition, or `undefined` for unlimited.
   * @public
   * @return {void}
   * @constructor
   */
  public constructor(fireInterval: number, ammunition?: number) {
    if (!Number.isFinite(fireInterval) || fireInterval < 0) {
      throw new RangeError('Weapon fire interval must be finite and non-negative.');
    }
    if (ammunition !== undefined && (!Number.isInteger(ammunition) || ammunition < 0)) {
      throw new RangeError('Weapon ammunition must be a non-negative integer.');
    }
    this.fireInterval = fireInterval;
    this.ammunition = signalValue(ammunition);
  }

  /**
   * Reduces the remaining firing cooldown.
   * @param deltaSeconds Duration of the frame in seconds.
   * @public
   * @return {void}
   */
  public update(deltaSeconds: number): void {
    if (!Number.isFinite(deltaSeconds) || deltaSeconds < 0) {
      throw new RangeError('Weapon delta seconds must be finite and non-negative.');
    }
    this.cooldownRemaining.set(Math.max(0, this.cooldownRemaining() - deltaSeconds));
  }

  /**
   * Attempts to fire, consuming ammunition and starting the cooldown on success.
   * @public
   * @return {boolean}
   */
  public tryFire(): boolean {
    const ammunition = this.ammunition();
    if (this.cooldownRemaining() > 0 || ammunition === 0) return false;
    if (ammunition !== undefined) this.ammunition.set(ammunition - 1);
    this.cooldownRemaining.set(this.fireInterval);
    return true;
  }

  /**
   * Refills ammunition, optionally replacing its capacity with a new count.
   * @param amount Ammunition to add, or the new total when replacing.
   * @param replace Whether to replace the current count instead of adding.
   * @public
   * @return {void}
   */
  public reload(amount: number, replace = false): void {
    if (!Number.isInteger(amount) || amount < 0) throw new RangeError('Reload amount must be a non-negative integer.');
    this.ammunition.set(replace ? amount : (this.ammunition() ?? 0) + amount);
  }
}
