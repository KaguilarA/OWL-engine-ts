import { signalValue } from 'reactive-values';
import { CircleBody, GameContext } from '../../engine';

/**
 * Pinball sphere with engine-backed position, velocity, and acceleration.
 * @class PinballBall
 */
export default class {
  /**
   * Body configuration or state owned by PinballBall.
   * @property {CircleBody} body
   * @readonly
   * @public
   */
  public readonly body: CircleBody;
  /**
   * Reactive in shooter lane state owned by PinballBall.
   * @property {SignalValue<boolean> & (() => boolean)} inShooterLane
   * @readonly
   * @private
   */
  private readonly inShooterLane = signalValue(true);

  /**
   * Initializes PinballBall and its owned resources from the supplied arguments.
   * @constructor
   * @param {number} x Horizontal coordinate in the owning coordinate space.
   * @param {number} y Vertical coordinate in the owning coordinate space.
   * @param {number} radius Radius of the circular shape.
   * @returns {void}
   * @public
   */
  public constructor(x: number, y: number, radius: number) {
    this.body = new CircleBody(x, y, radius, { layer: 1, mask: 14, restitution: 1 });
  }

  /**
   * Applies table drag and a speed limit without integrating motion or gravity.
   * @param {number} deltaSeconds Elapsed simulation time in seconds.
   * @returns {void}
   * @public
   */
  public applyDamping(deltaSeconds: number): void {
    const horizontalDrag = Math.pow(0.995, deltaSeconds * 60);
    this.body.setVelocity(this.body.velocityX * horizontalDrag, this.body.velocityY);
    const speed = Math.hypot(this.body.velocityX, this.body.velocityY);
    if (speed > 1100) {
      this.body.setVelocity(this.body.velocityX / speed * 1100, this.body.velocityY / speed * 1100);
    }
  }

  /**
   * Reports whether this ball still belongs to the shooter lane.
   * @returns {boolean} Whether the exit sensor has not redirected the ball yet.
   */
  public get isInShooterLane(): boolean { return this.inShooterLane(); }

  /**
   * Turns the ball into the playfield once, without changing its position.
   * @param {number} vx Horizontal exit velocity into the playfield.
   * @param {number} vy Vertical exit velocity into the playfield.
   * @returns {boolean} Whether this call performed the first shooter exit.
   * @public
   */
  public leaveShooter(vx: number, vy: number): boolean {
    if (!this.inShooterLane()) return false;
    this.inShooterLane.set(false);
    this.body.setVelocity(vx, vy);
    return true;
  }

  /**
   * Renders PinballBall using its current geometry and presentation state.
   * @returns {void}
   * @public
   */
  public draw(): void {
    const { x, y, radius } = this.body;
    GameContext.drawCircle(x + 2, y + 3, radius + 1, 'rgba(0, 0, 0, 0.45)');
    GameContext.drawCircle(x, y, radius, '#d5e8ff');
    GameContext.drawCircle(x - radius * 0.27, y - radius * 0.3, radius * 0.3, '#ffffff');
    GameContext.drawCircle(x + radius * 0.22, y + radius * 0.24, radius * 0.12, '#6c83a9');
  }
}
