import { signalValue, type SignalValue } from 'reactive-values';

/**
 * Reactive named numeric attributes for RPG characters, items, and enemies.
 * @class StatBlock
 */
export default class {
  /**
   * Current stat values keyed by stat name.
   * @property {SignalValue<Readonly<Record<string, number>>>} values
   * @public
   * @readonly
   */
  public readonly values: SignalValue<Readonly<Record<string, number>>>;

  /**
   * Creates a stat block from the supplied initial values.
   * @param values Initial stat values.
   * @public
   * @return {void}
   * @constructor
   */
  public constructor(values: Readonly<Record<string, number>> = {}) {
    this.validateValues(values);
    this.values = signalValue({ ...values });
  }

  /**
   * Returns the current value of a named stat, or zero when it is absent.
   * @param name Stat identifier.
   * @public
   * @return {number}
   */
  public get(name: string): number {
    return this.values()[name] ?? 0;
  }

  /**
   * Sets a named stat to an exact value.
   * @param name Stat identifier.
   * @param value New stat value.
   * @public
   * @return {void}
   */
  public set(name: string, value: number): void {
    this.assertStat(name, value);
    this.values.set({ ...this.values(), [name]: value });
  }

  /**
   * Adds an amount to a named stat and returns the updated value.
   * @param name Stat identifier.
   * @param amount Amount to add.
   * @public
   * @return {number}
   */
  public add(name: string, amount: number): number {
    this.assertStat(name, amount);
    const next = this.get(name) + amount;
    this.assertStat(name, next);
    this.values.set({ ...this.values(), [name]: next });
    return next;
  }

  /**
   * Removes a named stat from the block.
   * @param name Stat identifier.
   * @public
   * @return {boolean}
   */
  public remove(name: string): boolean {
    if (!Object.hasOwn(this.values(), name)) return false;
    const next = { ...this.values() };
    delete next[name];
    this.values.set(next);
    return true;
  }

  /**
   * Validates all values in an initial stat map.
   * @param values Initial stat values.
   * @private
   * @return {void}
   */
  private validateValues(values: Readonly<Record<string, number>>): void {
    for (const [name, value] of Object.entries(values)) this.assertStat(name, value);
  }

  /**
   * Validates a stat identifier and numeric value.
   * @param name Stat identifier.
   * @param value Stat value.
   * @private
   * @return {void}
   */
  private assertStat(name: string, value: number): void {
    if (!name.trim()) throw new RangeError('Stat name cannot be empty.');
    if (!Number.isFinite(value)) throw new RangeError(`Stat "${name}" must be finite.`);
  }
}
