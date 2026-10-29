/**
 * Defines the damageable sprite entity options contract shared by its consumers.
 * @interface DamageableSpriteEntityOptions
 */
export interface DamageableSpriteEntityOptions {
  /**
   * Callback notified with the damage actually taken by the entity.
   * @property {((damageTaken: number) => void) | undefined} onDamaged
   */
  onDamaged?: (damageTaken: number) => void;
  /**
   * Callback invoked when the entity enters its defeated state.
   * @property {(() => void) | undefined} onDefeated
   */
  onDefeated?: () => void;
}
