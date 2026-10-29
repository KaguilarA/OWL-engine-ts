import type { SignalValue } from 'reactive-values';
import type { InvaderEnemy, InvaderKind } from '..';

/**
 * Defines the invader contract shared by its consumers.
 * @interface Invader
 */
export interface Invader {
  /**
   * Entity owning or receiving the component.
   * @property {InvaderEnemy} entity
   */
  entity: InvaderEnemy;
  /**
   * Speed configuration or state owned by Invader.
   * @property {SignalValue<number>} speed
   */
  speed: SignalValue<number>;
  /**
   * Drift configuration or state owned by Invader.
   * @property {SignalValue<number>} drift
   */
  drift: SignalValue<number>;
  /**
   * Drift speed configuration or state owned by Invader.
   * @property {SignalValue<number>} driftSpeed
   */
  driftSpeed: SignalValue<number>;
  /**
   * Kind configuration or state owned by Invader.
   * @property {InvaderKind} kind
   * @readonly
   */
  readonly kind: InvaderKind;
  /**
   * Fire timer configuration or state owned by Invader.
   * @property {SignalValue<number>} fireTimer
   */
  fireTimer: SignalValue<number>;
}
