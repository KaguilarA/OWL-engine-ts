/**
 * Defines the damageable sprite entity options contract shared by its consumers.
 * @interface DamageableSpriteEntityOptions
 */
export interface DamageableSpriteEntityOptions {
  /**
   * Callback handling damaged for DamageableSpriteEntityOptions.
   * @property {((damageTaken: number) => void) | undefined} onDamaged
   */
  onDamaged?: (damageTaken: number) => void;
  /**
   * Callback handling defeated for DamageableSpriteEntityOptions.
   * @property {(() => void) | undefined} onDefeated
   */
  onDefeated?: () => void;
}
