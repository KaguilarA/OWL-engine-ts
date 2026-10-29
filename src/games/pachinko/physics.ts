import { computedValue, signalValue } from 'reactive-values';
import { RigidBody2D, type CollisionRect, type PhysicsWorld } from '../../engine';
import type { PachinkoBoard } from './';

/**
 * Owns scene colliders derived from the board's responsive geometry.
 * @class PachinkoPhysics
 */
export default class {
  /**
   * Last board layout committed to the physics world.
   * @property {SignalValue<CollisionRect | undefined>} layout
   */
  public readonly layout = signalValue<CollisionRect | undefined>(undefined);
  /**
   * Static peg bodies indexed identically to the rendered pegs.
   * @property {SignalValue<readonly RigidBody2D[]>} pegs
   */
  public readonly pegs = signalValue<readonly RigidBody2D[]>([]);
  /**
   * Outer walls and convex lane dividers.
   * @property {SignalValue<readonly RigidBody2D[]>} barriers
   */
  public readonly barriers = signalValue<readonly RigidBody2D[]>([]);
  /**
   * One payout trigger per lane below the divider ends.
   * @property {SignalValue<readonly RigidBody2D[]>} payoutSensors
   */
  public readonly payoutSensors = signalValue<readonly RigidBody2D[]>([]);
  /**
   * All registrations owned by this adapter.
   * @property {ComputedValue<readonly RigidBody2D[]>} bodies
   */
  public readonly bodies = computedValue(() => [...this.pegs(), ...this.barriers(), ...this.payoutSensors()], [this.pegs, this.barriers, this.payoutSensors]);
  /**
   * Prevents rebuilding after the owning game is disposed.
   * @property {SignalValue<boolean>} disposed
   * @private
   */
  private readonly disposed = signalValue(false);
  /**
   * World receiving only this board's collider registrations.
   * @property {PhysicsWorld} world
   * @private
   */
  private readonly world: PhysicsWorld;
  /**
   * Shared responsive board geometry.
   * @property {PachinkoBoard} board
   * @private
   */
  private readonly board: PachinkoBoard;

  /**
   * Registers the board geometry in its game's existing world.
   * @param {PhysicsWorld} world Scene-owned physics simulation.
   * @param {PachinkoBoard} board Source of rendered geometry.
   * @returns {void}
   */
  public constructor(world: PhysicsWorld, board: PachinkoBoard) {
    this.world = world;
    this.board = board;
    this.syncLayout();
  }

  /**
   * Replaces collider geometry when the viewport layout changes.
   * @returns {CollisionRect | undefined} Previous bounds when a rebuild occurred.
   */
  public syncLayout(): CollisionRect | undefined {
    const bounds = this.board.bounds;
    const previous = this.layout();
    if (this.disposed() || bounds === previous) return undefined;
    for (const body of this.bodies()) this.world.removeBody(body);
    this.pegs.set(this.board.pegs().map(peg => new RigidBody2D({ type: 'static',
      x: peg.x, y: peg.y, shape: { kind: 'circle', radius: peg.radius }, layer: 2, mask: 1, restitution: 0.68 })));
    this.barriers.set([
      ...this.board.rails().map(rail => new RigidBody2D({ type: 'static',
        x: rail.x + rail.width / 2, y: rail.y + rail.height / 2,
        shape: { kind: 'box', width: rail.width, height: rail.height }, layer: 2, mask: 1, restitution: 0.55 })),
      ...this.board.laneWalls().map(wall => new RigidBody2D({ type: 'static',
        x: wall.x + wall.width / 2, y: wall.y + wall.height / 2,
        shape: { kind: 'polygon', vertices: [
          { x: 0, y: -wall.height / 2 }, { x: wall.width / 2, y: -wall.height / 2 + 4 },
          { x: wall.width / 2, y: wall.height / 2 }, { x: -wall.width / 2, y: wall.height / 2 },
          { x: -wall.width / 2, y: -wall.height / 2 + 4 }
        ] }, layer: 2, mask: 1, restitution: 0.35 }))
    ]);
    const laneWidth = bounds.width / this.board.laneCount;
    this.payoutSensors.set(Array.from({ length: this.board.laneCount }, (_, lane) => new RigidBody2D({
      type: 'static', sensor: true, x: this.board.laneCenter(lane), y: this.board.laneBottom + 24,
      shape: { kind: 'box', width: laneWidth, height: 2 }, layer: 4, mask: 1
    })));
    this.layout.set(bounds);
    for (const body of this.bodies()) this.world.addBody(body);
    return previous;
  }

  /**
   * Releases only the board's registrations; repeated disposal is harmless.
   * @returns {void}
   */
  public dispose(): void {
    if (this.disposed()) return;
    this.disposed.set(true);
    for (const body of this.bodies()) this.world.removeBody(body);
    this.pegs.set([]); this.barriers.set([]); this.payoutSensors.set([]);
  }
}
