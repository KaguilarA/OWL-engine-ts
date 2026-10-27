import { StatBlock } from '../../engine';

/**
 * A battle participant whose combat attributes are stored in a reactive stat block.
 * @class RpgCombatant
 */
export default class RpgCombatant {
  /**
   * Display name used by the battle interface.
   * @property {string} name
   * @public
   * @readonly
   */
  public readonly name: string;

  /**
   * Team that owns this combatant.
   * @property {'party' | 'enemy'} side
   * @public
   * @readonly
   */
  public readonly side: 'party' | 'enemy';

  /**
   * Combat attributes including health, magic, attack, defense, and speed.
   * @property {StatBlock} stats
   * @public
   * @readonly
   */
  public readonly stats: StatBlock;

  /**
   * Creates a combat participant with the supplied identity and combat values.
   * @param name Display name.
   * @param side Whether the participant belongs to the party or enemy team.
   * @param stats Initial combat attributes.
   * @public
   * @return {void}
   */
  public constructor(
    name: string,
    side: 'party' | 'enemy',
    stats: Readonly<Record<string, number>>
  ) {
    this.name = name;
    this.side = side;
    this.stats = new StatBlock(stats);
  }

  /**
   * Reports whether the participant can still take a turn.
   * @public
   * @return {boolean}
   */
  public get isAlive(): boolean {
    return this.stats.get('hp') > 0;
  }
}
