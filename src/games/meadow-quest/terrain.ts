import { RigidBody2D, Tilemap, TilemapCollider, type PhysicsWorld } from '../../engine';
import type { Platform } from './';

/**
 * Builds the visible ground tilemap and its matching collision terrain.
 * @class MeadowTerrain
 */
export default class {
  /**
   * Ground map used by both the renderer and TilemapCollider.
   * @property {Tilemap} map
   */
  public readonly map: Tilemap;
  /**
   * Adapter owning the ground's reactive collision bodies.
   * @property {TilemapCollider} ground
   * @private
   */
  private readonly ground: TilemapCollider;
  /**
   * Additional one-way ledges and solid world boundaries owned by this terrain.
   * @property {readonly RigidBody2D[]} obstacles
   * @private
   */
  private readonly obstacles: readonly RigidBody2D[];

  /**
   * Scene receiving this terrain's body registrations.
   * @property {PhysicsWorld} world
   * @private
   */
  private readonly world: PhysicsWorld;

  /**
   * Builds terrain matching the existing level and procedural ground appearance.
   * @param {PhysicsWorld} world Scene owning all collision bodies.
   * @param {readonly Platform[]} platforms Rendered ledges and floor description.
   * @param {number} worldWidth Level width in logical units.
   * @param {number} height Viewport height used to position and size terrain.
   * @returns {void}
   */
  public constructor(world: PhysicsWorld, platforms: readonly Platform[], worldWidth: number, height: number) {
    this.world = world;
    const image = document.createElement('canvas');
    image.width = 42;
    image.height = 100;
    const context = image.getContext('2d');
    if (!context) throw new Error('Meadow terrain requires a canvas rendering context.');
    context.fillStyle = '#56b844'; context.fillRect(0, 0, 42, 100);
    context.fillStyle = '#9b592d'; context.fillRect(0, 15, 42, 85);
    context.fillStyle = '#c87c3a'; context.fillRect(0, 15, 40, 3);
    context.fillStyle = '#704122'; context.fillRect(18, 18, 3, 22);
    this.map = new Tilemap({ image, columns: 1, tileWidth: 42, tileHeight: 100,
      mapWidth: Math.ceil(worldWidth / 42), mapHeight: 1, y: height * 0.79,
      drawTileHeight: Math.max(100, height * 0.21) });
    this.map.fill(1);
    this.ground = new TilemapCollider(this.map, world, { layer: 2, mask: 1 });
    this.obstacles = [
      ...platforms.filter(platform => platform.kind !== 'ground').map(platform => new RigidBody2D({
        type: 'static', x: platform.x + platform.width / 2, y: platform.y + platform.height / 2,
        shape: { kind: 'box', width: platform.width, height: platform.height }, oneWay: true, layer: 2, mask: 1
      })),
      ...[8, worldWidth - 80].map(x => new RigidBody2D({ type: 'static', x, y: height / 2,
        shape: { kind: 'box', width: 20, height: height * 4 }, layer: 2, mask: 1 }))
    ];
    for (const obstacle of this.obstacles) world.addBody(obstacle);
  }

  /**
   * Releases the reactive adapter and only this terrain's obstacle registrations.
   * @returns {void}
   */
  public dispose(): void {
    this.ground.dispose();
    for (const obstacle of this.obstacles) this.world.removeBody(obstacle);
  }
}
