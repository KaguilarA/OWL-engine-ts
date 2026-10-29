import { computedValue, signalValue, type ComputedValue } from 'reactive-values';
import { RigidBody2D, type CollisionRect, type PhysicsWorld } from '../../engine';
import type { PinballBoard, PinballFlipper } from './';

/**
 * Owns board colliders and responsive flipper registrations in the game's world.
 * @class PinballPhysics
 */
export default class {
  /**
   * Responsive board rectangle currently registered in the world.
   * @property {SignalValue<CollisionRect | undefined>} layout
   */
  public readonly layout = signalValue<CollisionRect | undefined>(undefined);
  /**
   * Static walls and rounded orbit rail segments.
   * @property {SignalValue<readonly RigidBody2D[]>} barriers
   */
  public readonly barriers = signalValue<readonly RigidBody2D[]>([]);
  /**
   * Bumper circles indexed identically to their rendered geometry.
   * @property {SignalValue<readonly RigidBody2D[]>} bumpers
   */
  public readonly bumpers = signalValue<readonly RigidBody2D[]>([]);
  /**
   * Scoring target boxes indexed identically to the board targets.
   * @property {SignalValue<readonly RigidBody2D[]>} targets
   */
  public readonly targets = signalValue<readonly RigidBody2D[]>([]);
  /**
   * Convex slingshots matching their visible filled outlines.
   * @property {SignalValue<readonly RigidBody2D[]>} slingshots
   */
  public readonly slingshots = signalValue<readonly RigidBody2D[]>([]);
  /**
   * Sensor turning a launched ball from the shooter into the playfield.
   * @property {SignalValue<RigidBody2D | undefined>} shooterExit
   */
  public readonly shooterExit = signalValue<RigidBody2D | undefined>(undefined);
  /**
   * Sensor reporting a lost ball below the open lower edge.
   * @property {SignalValue<RigidBody2D | undefined>} drain
   */
  public readonly drain = signalValue<RigidBody2D | undefined>(undefined);
  /**
   * Prevents rebuilding registrations after game disposal.
   * @property {SignalValue<boolean>} disposed
   */
  private readonly disposed = signalValue(false);
  /**
   * Scene receiving the adapter-owned collider registrations.
   * @property {PhysicsWorld} world
   * @private
   */
  private readonly world: PhysicsWorld;
  /**
   * Responsive geometry shared with the visible table.
   * @property {PinballBoard} board
   * @private
   */
  private readonly board: PinballBoard;
  /**
   * Input-driven bats whose samples participate in the same simulation.
   * @property {readonly PinballFlipper[]} flippers
   * @private
   */
  private readonly flippers: readonly PinballFlipper[];
  /**
   * All adapter-owned registrations derived from their reactive collections.
   * @property {ComputedValue<readonly RigidBody2D[]>} bodies
   */
  public readonly bodies: ComputedValue<readonly RigidBody2D[]>;

  /**
   * Creates board geometry in the existing scene world, without a second loop.
   * @param {PhysicsWorld} world Scene-owned simulation.
   * @param {PinballBoard} board Source of visible geometry.
   * @param {readonly PinballFlipper[]} flippers Input-driven kinematic bats.
   * @returns {void}
   */
  public constructor(world: PhysicsWorld, board: PinballBoard, flippers: readonly PinballFlipper[]) {
    this.world = world; this.board = board; this.flippers = flippers;
    this.bodies = computedValue(() => [...this.barriers(), ...this.bumpers(), ...this.targets(),
      ...this.slingshots(), ...this.flippers.flatMap(flipper => flipper.bodies()),
      ...(this.shooterExit() ? [this.shooterExit()!] : []), ...(this.drain() ? [this.drain()!] : [])
    ], [this.barriers, this.bumpers, this.targets, this.slingshots, this.shooterExit, this.drain,
      ...flippers.map(flipper => flipper.bodies)]);
    this.syncLayout();
  }

  /**
   * Rebuilds colliders only after a layout change or an explicit run reset.
   * @param {boolean} [force] Whether to rebuild unchanged geometry after resetting bats.
   * @returns {CollisionRect | undefined} Previous bounds when a rebuild occurred.
   */
  public syncLayout(force = false): CollisionRect | undefined {
    const bounds = this.board.bounds, previous = this.layout();
    if (this.disposed() || (!force && previous === bounds)) return undefined;
    const walls = this.board.walls().map((wall, index) => new RigidBody2D({ type: 'static',
      x: wall.x + wall.width / 2, y: wall.y + wall.height / 2,
      shape: { kind: 'box', width: wall.width, height: wall.height },
      layer: 2, mask: 1, restitution: index === 2 ? 0.72 : 0.76 }));
    const thickness = Math.max(3, bounds.width * 0.012);
    const rails = this.board.rails().flatMap(segment => this.createRail(segment, thickness));
    const bumpers = this.board.bumpers().map(bumper => new RigidBody2D({ type: 'static',
      x: bumper.x, y: bumper.y, shape: { kind: 'circle', radius: bumper.radius },
      layer: 2, mask: 1, restitution: 1 }));
    const targets = this.board.targets().map(target => new RigidBody2D({ type: 'static',
      x: target.x + target.width / 2, y: target.y + target.height / 2,
      shape: { kind: 'box', width: target.width, height: target.height }, layer: 2, mask: 1, restitution: 0.86 }));
    const slingshots = this.board.slingshots().map(vertices => new RigidBody2D({ type: 'static',
      shape: { kind: 'polygon', vertices }, layer: 2, mask: 1, restitution: 0.9 }));
    for (const body of this.bodies()) this.world.removeBody(body);
    for (const flipper of this.flippers) flipper.configure(bounds);
    this.barriers.set([...walls, ...rails]); this.bumpers.set(bumpers);
    this.targets.set(targets); this.slingshots.set(slingshots);
    const laneWidth = bounds.x + bounds.width - this.board.shooterDividerX;
    this.shooterExit.set(new RigidBody2D({ type: 'static', sensor: true, layer: 4, mask: 1,
      x: this.board.shooterDividerX + laneWidth / 2, y: this.board.shooterExitY,
      shape: { kind: 'box', width: laneWidth, height: 2 } }));
    this.drain.set(new RigidBody2D({ type: 'static', sensor: true, layer: 4, mask: 1,
      x: bounds.x + bounds.width / 2, y: bounds.y + bounds.height + this.board.ballRadius() * 2 + 2,
      shape: { kind: 'box', width: bounds.width + this.board.ballRadius() * 4, height: 2 } }));
    this.layout.set(bounds);
    for (const body of this.bodies()) this.world.addBody(body);
    return previous;
  }

  /**
   * Constructs a rounded static segment from an oriented box and its two caps.
   * @param {readonly number[]} segment Start and end coordinates in world units.
   * @param {number} thickness Full rail width matching the existing segment collider.
   * @returns {readonly RigidBody2D[]} Capsule components handled by the world solver.
   * @private
   */
  private createRail(segment: readonly number[], thickness: number): readonly RigidBody2D[] {
    const [x1, y1, x2, y2] = segment;
    return [new RigidBody2D({ type: 'static', x: (x1 + x2) / 2, y: (y1 + y2) / 2,
      angle: Math.atan2(y2 - y1, x2 - x1), shape: { kind: 'box', width: Math.hypot(x2 - x1, y2 - y1), height: thickness },
      layer: 2, mask: 1, restitution: 0.78 }),
      ...[{ x: x1, y: y1 }, { x: x2, y: y2 }].map(point => new RigidBody2D({ type: 'static',
        ...point, shape: { kind: 'circle', radius: thickness / 2 }, layer: 2, mask: 1, restitution: 0.78 }))];
  }

  /**
   * Releases all owned bodies without clearing other registrations in the scene.
   * @returns {void}
   */
  public dispose(): void {
    if (this.disposed()) return;
    this.disposed.set(true);
    for (const body of this.bodies()) this.world.removeBody(body);
    this.barriers.set([]); this.bumpers.set([]); this.targets.set([]); this.slingshots.set([]);
    this.shooterExit.set(undefined); this.drain.set(undefined);
    for (const flipper of this.flippers) flipper.bodies.set([]);
  }
}
