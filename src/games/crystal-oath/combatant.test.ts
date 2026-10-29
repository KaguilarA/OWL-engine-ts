import { describe, expect, it } from 'vitest';

import { RpgCombatant } from './';

/**
 * Verifies the combatant state used by Crystal Oath battles.
 * @returns {void}
 */
describe('RpgCombatant', () => {
  /**
   * Creates a combatant with the supplied starting hit points.
   * @param hp Starting hit points.
   * @returns {RpgCombatant}
   */
  const createCombatant = (hp: number): RpgCombatant => new RpgCombatant('Knight', 'party', {
    hp,
    maxHp: 30,
    mp: 5,
    maxMp: 8,
    attack: 9,
    defense: 4,
    speed: 6
  });

  it('retains its identity, team, and initial stats', () => {
    const combatant = createCombatant(24);

    expect(combatant.name).toBe('Knight');
    expect(combatant.side).toBe('party');
    expect(combatant.stats.get('hp')).toBe(24);
    expect(combatant.stats.get('attack')).toBe(9);
  });

  it('is alive while its hit points are positive', () => {
    const combatant = createCombatant(1);

    expect(combatant.isAlive).toBe(true);
    combatant.stats.set('hp', 0);
    expect(combatant.isAlive).toBe(false);
  });
});
