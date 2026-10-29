import { signalValue } from 'reactive-values';
import { CircleBody, GameContext } from '../../engine';

/**
 * Lightweight game token that delegates motion to the engine's circle body.
 * @class PachinkoBall
 */
export default class {
  /**
   * Body configuration or state owned by PachinkoBall.
   * @property {CircleBody} body
   * @readonly
   * @public
   */
  public readonly body: CircleBody;
  /**
   * Reactive deflection state state owned by PachinkoBall.
   * @property {SignalValue<number> & (() => number)} deflectionState
   * @readonly
   * @private
   */
  private readonly deflectionState = signalValue(0x6d2b79f5);
  /**
   * Reactive peg contact state owned by PachinkoBall.
   * @property {SignalValue<number> & (() => number)} pegContact
   * @readonly
   * @private
   */
  private readonly pegContact = signalValue(-1);

  /**
   * Initializes PachinkoBall and its owned resources from the supplied arguments.
   * @constructor
   * @param {number} x Horizontal coordinate in the owning coordinate space.
   * @param {number} y Vertical coordinate in the owning coordinate space.
   * @param {number} radius Radius of the circular shape.
   * @returns {void}
   * @public
   */
  public constructor(x: number, y: number, radius: number) {
    this.body = new CircleBody(x, y, radius, { layer: 1, mask: 6, restitution: 1 });
    this.body.setVelocity(0, 35);
    this.deflectionState.set((Math.floor(x * 17 + y * 31) | 0) || 0x6d2b79f5);
  }

  /**
   * Adds deterministic lateral motion to perfectly centered peg impacts.
   * @param {number} pegX Horizontal center of the contacted peg.
   * @param {number} pegIndex Stable peg index for suppressing repeated deflections.
   * @returns {void}
   * @public
   */
  public deflectFromPeg(pegX: number, pegIndex: number): void {
    if (this.pegContact() === pegIndex || Math.abs(this.body.x - pegX) > this.body.radius * 0.6) return;
    this.pegContact.set(pegIndex);
    let state = this.deflectionState();
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    state |= 0;
    this.deflectionState.set(state);
    const direction = (state & 1) === 0 ? -1 : 1;
    const impulse = Math.max(70, Math.min(145, Math.abs(this.body.velocityY) * 0.3));
    const lateralVelocity = Math.max(-240, Math.min(240, this.body.velocityX + direction * impulse));
    this.body.setVelocity(lateralVelocity, this.body.velocityY);
  }

  /**
   * Clears the remembered peg contact before another collision can be registered.
   * @returns {void}
   * @public
   */
  public clearPegContact(): void {
    this.pegContact.set(-1);
  }

  /**
   * Renders PachinkoBall using its current geometry and presentation state.
   * @returns {void}
   * @public
   */
  public draw(): void {
    const { x, y, radius } = this.body;
    GameContext.drawCircle(x, y, radius + 2, '#ffca57');
    GameContext.drawCircle(x - radius * 0.16, y - radius * 0.18, radius * 0.62, '#fff4bf');
    GameContext.drawCircle(x, y, radius * 0.78, '#ef8e31');
  }
}
