import type { PhysicsContact } from './';

/**
 * Fixed-step contact transition; a sensor crossed within a step emits begin followed by end.
 * @interface PhysicsContactEvent
 */
export interface PhysicsContactEvent extends PhysicsContact {
  /**
   * Lifecycle phase of the collider pair.
   * @property {string} phase
   */
  readonly phase: 'begin' | 'stay' | 'end';
  /**
   * Whether either collider reports contacts without physical response.
   * @property {boolean} sensor
   */
  readonly sensor: boolean;
}
