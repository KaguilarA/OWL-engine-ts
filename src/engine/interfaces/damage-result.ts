/**
 * Defines the damage result contract shared by its consumers.
 * @interface DamageResult
 */
export interface DamageResult {
  /**
   * Was damaged configuration or state owned by DamageResult.
   * @property {boolean} wasDamaged
   */
  wasDamaged: boolean;
  /**
   * Is depleted configuration or state owned by DamageResult.
   * @property {boolean} isDepleted
   */
  isDepleted: boolean;
}
