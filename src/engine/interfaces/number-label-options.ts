/**
 * Defines the number label options contract shared by its consumers.
 * @interface NumberLabelOptions
 */
export interface NumberLabelOptions {
  /**
   * Locale configuration or state owned by NumberLabelOptions.
   * @property {string | undefined} locale
   */
  locale?: string;
  /**
   * Mode configuration or state owned by NumberLabelOptions.
   * @property {"currency" | "count" | "decimal" | undefined} mode
   */
  mode?: 'currency' | 'count' | 'decimal';
  /**
   * Currency configuration or state owned by NumberLabelOptions.
   * @property {string | undefined} currency
   */
  currency?: string;
  /**
   * Minimum fraction digits configuration or state owned by NumberLabelOptions.
   * @property {number | undefined} minimumFractionDigits
   */
  minimumFractionDigits?: number;
  /**
   * Maximum fraction digits configuration or state owned by NumberLabelOptions.
   * @property {number | undefined} maximumFractionDigits
   */
  maximumFractionDigits?: number;
  /**
   * Use grouping configuration or state owned by NumberLabelOptions.
   * @property {boolean | undefined} useGrouping
   */
  useGrouping?: boolean;
}
