import { NumberLabel, Label } from './';
import { signalValue, type SignalValue } from 'reactive-values';
import type { LabelOptions, NumberLabelOptions } from '../interfaces';

/**
 * Formats reactive currency, count, or decimal values as a standard Label.
 * @class NumberLabel
 */
export default class extends Label {
  /**
   * Value to read, validate, format, or assign.
   * @property {SignalValue<number>} value
   * @readonly
   * @private
   */
  private readonly value: SignalValue<number>;
  /**
   * Number options configuration or state owned by NumberLabel.
   * @property {Required<NumberLabelOptions>} numberOptions
   * @readonly
   * @private
   */
  private readonly numberOptions: Required<NumberLabelOptions>;

  /**
   * Initializes NumberLabel and its owned resources from the supplied arguments.
   * @constructor
   * @param {string | number} value Value to read, validate, format, or assign.
   * @param {LabelOptions} [labelOptions] The label options supplied to this operation.
   * @param {NumberLabelOptions} [numberOptions] The number options supplied to this operation.
   * @returns {void}
   * @public
   */
  public constructor(value: number | string, labelOptions: LabelOptions = {}, numberOptions: NumberLabelOptions = {}) {
    const normalizedOptions: Required<NumberLabelOptions> = {
      locale: numberOptions.locale ?? 'en-US',
      mode: numberOptions.mode ?? 'decimal',
      currency: numberOptions.currency ?? 'USD',
      minimumFractionDigits: numberOptions.minimumFractionDigits ?? (numberOptions.mode === 'count' ? 0 : 2),
      maximumFractionDigits: numberOptions.maximumFractionDigits ?? (numberOptions.mode === 'count' ? 0 : 2),
      useGrouping: numberOptions.useGrouping ?? true
    };
    const parsed = NumberLabel.parseValue(value, normalizedOptions.locale);
    super(NumberLabel.formatValue(parsed, normalizedOptions), labelOptions);
    this.value = signalValue(parsed);
    this.numberOptions = normalizedOptions;
  }

  /**
   * Assigns the numeric value presented by this label.
   * @param {string | number} value Value to read, validate, format, or assign.
   * @returns {void}
   * @public
   */
  public setValue(value: number | string): void {
    const parsed = NumberLabel.parseValue(value, this.numberOptions.locale);
    this.value.set(parsed);
    this.setText(NumberLabel.formatValue(parsed, this.numberOptions));
  }

  /**
   * Returns the label’s current numeric value.
   * @returns {number} the label’s current numeric value.
   * @public
   */
  public getValue(): number { return this.value(); }

  /**
   * Converts an incoming value into the numeric representation used by the label.
   * @param {string | number} value Value to read, validate, format, or assign.
   * @param {string} locale The locale supplied to this operation.
   * @returns {number} Converts an incoming value into the numeric representation used by the label.
   * @private
   */
  private static parseValue(value: number | string, locale: string): number {
    if (typeof value === 'number') {
      if (!Number.isFinite(value)) throw new RangeError('NumberLabel requires a finite number.');
      return value;
    }
    const source = value.trim();
    const parsedDirectly = Number(source);
    if (Number.isFinite(parsedDirectly)) return parsedDirectly;
    const accountingNegative = source.startsWith('(') && source.endsWith(')');
    const parts = new Intl.NumberFormat(locale).formatToParts(12345.6);
    const group = parts.find((part) => part.type === 'group')?.value ?? ',';
    const decimal = parts.find((part) => part.type === 'decimal')?.value ?? '.';
    const normalized = source
      .replace(/[\u00a0\u202f\s]/g, '')
      .replace(new RegExp(`[${NumberLabel.escapeRegExp(group)}]`, 'g'), '')
      .replace(new RegExp(NumberLabel.escapeRegExp(decimal), 'g'), '.')
      .replace(/[^\d.+-]/g, '');
    const parsed = Number(normalized);
    const result = accountingNegative ? -Math.abs(parsed) : parsed;
    if (!Number.isFinite(result)) throw new TypeError(`Cannot parse numeric label value "${value}".`);
    return result;
  }

  /**
   * Formats the numeric value according to the label’s display options.
   * @param {number} value Value to read, validate, format, or assign.
   * @param {Required<NumberLabelOptions>} options Configuration controlling construction or behavior.
   * @returns {string} Formats the numeric value according to the label’s display options.
   * @private
   */
  private static formatValue(value: number, options: Required<NumberLabelOptions>): string {
    const style: Intl.NumberFormatOptions = options.mode === 'currency'
      ? { style: 'currency', currency: options.currency }
      : { style: 'decimal' };
    return new Intl.NumberFormat(options.locale, {
      ...style,
      minimumFractionDigits: options.minimumFractionDigits,
      maximumFractionDigits: options.maximumFractionDigits,
      useGrouping: options.useGrouping
    }).format(value);
  }

  /**
   * Escapes regular-expression metacharacters before constructing a matching expression.
   * @param {string} value Value to read, validate, format, or assign.
   * @returns {string} Escapes regular-expression metacharacters before constructing a matching expression.
   * @private
   */
  private static escapeRegExp(value: string): string {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
}
