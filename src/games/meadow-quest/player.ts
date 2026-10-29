import { computedValue } from 'reactive-values';
import { GameContext, PlatformerController, RigidBody2D } from '../../engine';

/**
 * Owns the hero's collider and controller, sharing a single reactive motion source.
 * @class MeadowPlayer
 */
export default class {
  /**
   * Hero width in logical canvas units for this viewport layout.
   * @property {number} width
   */
  public readonly width: number;
  /**
   * Hero height in logical canvas units for this viewport layout.
   * @property {number} height
   */
  public readonly height: number;
  /**
   * Dynamic collider integrated exclusively by the scene's PhysicsWorld.
   * @property {RigidBody2D} body
   */
  public readonly body: RigidBody2D;
  /**
   * Buffered jump and movement input applied to the collider's motion.
   * @property {PlatformerController} controller
   */
  public readonly controller: PlatformerController;
  /**
   * Hero left edge derived from collider position.
   * @property {ComputedValue<number>} left
   */
  public readonly left;
  /**
   * Hero top edge derived from collider position.
   * @property {ComputedValue<number>} top
   */
  public readonly top;
  /**
   * Camera offset derived from the hero and current viewport width.
   * @property {ComputedValue<number>} cameraX
   */
  public readonly cameraX;

  /**
   * Creates a responsive hero with a shared body for input and world simulation.
   * @param {number} viewportHeight Available canvas height.
   * @param {number} worldWidth Horizontal extent of the level.
   * @param {number} [left] Initial left edge of the hero.
   * @param {number} [top] Initial top edge, defaulting to the ground surface.
   * @returns {void}
   */
  public constructor(viewportHeight: number, worldWidth: number, left = 90,
    top = viewportHeight * 0.79 - Math.max(25, viewportHeight * 0.045) * 1.35) {
    this.width = Math.max(25, viewportHeight * 0.045);
    this.height = this.width * 1.35;
    this.body = new RigidBody2D({ x: left + this.width / 2, y: top + this.height / 2,
      shape: { kind: 'box', width: this.width, height: this.height }, layer: 1, mask: 6, restitution: 0 });
    this.controller = new PlatformerController(0, 0, { body: this.body.motion });
    this.left = computedValue(() => this.body.x - this.width / 2, [this.body.motion.x]);
    this.top = computedValue(() => this.body.y - this.height / 2, [this.body.motion.y]);
    const viewportWidth = GameContext.gameDimensionsModel.getWidth();
    this.cameraX = computedValue(() => Math.max(0, Math.min(
      Math.max(0, worldWidth - viewportWidth),
      this.body.x - this.width / 2 - viewportWidth * 0.36
    )), [this.body.motion.x]);
  }
}
