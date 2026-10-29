import {
  DamageableSpriteEntity,
  GameLoader,
  Sprite
} from '../../engine';

/**
 * Defines the invader kind contract shared by its consumers.
 * @typedef {InvaderKind} InvaderKind
 */
export type InvaderKind = 'beetlemorph' | 'rhinomorph' | 'lobstermorph';

/**
 * Supplies Shoot ’Em All's alien art to the shared engine combat behavior.
 * @class InvaderEnemy
 */
export default class extends DamageableSpriteEntity {
  /**
   * Initializes InvaderEnemy and its owned resources from the supplied arguments.
   * @constructor
   * @param {number} x Horizontal coordinate in the owning coordinate space.
   * @param {number} y Vertical coordinate in the owning coordinate space.
   * @param {number} points The points supplied to this operation.
   * @param {number} maximumHealth The maximum health supplied to this operation.
   * @param {number} width Width of the represented area.
   * @param {number} height Height of the represented area.
   * @param {InvaderKind} kind The kind supplied to this operation.
   * @returns {void}
   * @public
   */
  public constructor(
    x: number,
    y: number,
    points: number,
    maximumHealth: number,
    width: number,
    height: number,
    kind: InvaderKind
  ) {
    const atlas = GameLoader.getAtlas(kind);
    const sprite = new Sprite(GameLoader.getImage(kind), width, height, x, y);
    sprite.playAtlasClip(atlas.getAnimation('idle'));
    super(sprite, points, maximumHealth, {
      onDamaged: (damageTaken) => {
        if (kind === 'rhinomorph') {
          sprite.playAtlasClip(atlas.getAnimation('cracked'));
        } else if (kind === 'lobstermorph') {
          sprite.playAtlasClip(atlas.getAnimation(damageTaken === 1 ? 'swollen-1' : 'swollen-2'));
        }
      },
      onDefeated: () => sprite.playAtlasClip(atlas.getAnimation('explosion'))
    });
  }
}
