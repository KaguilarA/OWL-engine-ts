import { computedValue, signalValue } from 'reactive-values';
import {
  GameContext,
  GameLoader,
  Sprite,
  type AtlasAnimation,
  type PhysicsPoint,
  type CollisionRect
} from '../../engine';

import type { PinballBumper } from './';

/**
 * Space-Cadet-inspired table layout, launcher lane, scoring targets, and rails.
 * @class PinballBoard
 */
export default class {
  /**
   * Viewport input scoped to this board without retaining global subscriptions.
   * @property {SignalValue<object>} viewport
   * @private
   */
  private readonly viewport = signalValue({ width: GameContext.gameDimensionsModel.getWidth(), height: GameContext.gameDimensionsModel.getHeight() });
  /**
   * Table bounds derived from the current viewport configuration.
   * @property {ComputedValue<CollisionRect>} layout
   */
  public readonly layout = computedValue<CollisionRect>(() => {
    const viewport = this.viewport();
    const width = Math.min(viewport.width * 0.62, 440);
    const top = Math.max(56, viewport.height * 0.14);
    const y = Math.min(top, Math.max(40, viewport.height - 140));
    const height = Math.max(24, Math.min(viewport.height * 0.72, 620, viewport.height - y - 34));
    return { x: (viewport.width - width) / 2, y, width, height };
  }, [this.viewport]);
  /**
   * Bumper circles shared by rendering and physics.
   * @property {ComputedValue<readonly PinballBumper[]>} bumpers
   */
  public readonly bumpers = computedValue(() => this.createBumpers(this.bounds), [this.viewport]);
  /**
   * Scoring target rectangles shared by rendering and physics.
   * @property {ComputedValue<readonly CollisionRect[]>} targets
   */
  public readonly targets = computedValue(() => this.createTargets(this.bounds), [this.viewport]);
  /**
   * Table walls and shooter divider shared with the physics adapter.
   * @property {ComputedValue<readonly CollisionRect[]>} walls
   */
  public readonly walls = computedValue(() => this.createWalls(this.bounds), [this.viewport]);
  /**
   * Sampled orbit segments shared with the static collision capsules.
   * @property {ComputedValue<readonly number[][]>} rails
   */
  public readonly rails = computedValue(() => this.createRails(this.bounds), [this.viewport]);
  /**
   * Convex slingshot outlines shared by their rendering and colliders.
   * @property {ComputedValue<readonly PhysicsPoint[][]>} slingshots
   */
  public readonly slingshots = computedValue(() => this.createSlingshots(this.bounds), [this.viewport]);
  /**
   * Bumper visuals configuration or state owned by PinballBoard.
   * @property {readonly Sprite[]} bumperVisuals
   * @readonly
   * @private
   */
  private readonly bumperVisuals: readonly Sprite[];
  /**
   * Bumper idle visuals configuration or state owned by PinballBoard.
   * @property {readonly Sprite[]} bumperIdleVisuals
   * @readonly
   * @private
   */
  private readonly bumperIdleVisuals: readonly Sprite[];
  /**
   * Bumper animations configuration or state owned by PinballBoard.
   * @property {readonly AtlasAnimation[]} bumperAnimations
   * @readonly
   * @private
   */
  private readonly bumperAnimations: readonly AtlasAnimation[];
  /**
   * Bumper symbols configuration or state owned by PinballBoard.
   * @property {readonly ["beetlemorph", "eaglemorph", "squidmorph"]} bumperSymbols
   * @readonly
   * @private
   */
  private readonly bumperSymbols = ['beetlemorph', 'eaglemorph', 'squidmorph'] as const;
  /**
   * Bumper animating configuration or state owned by PinballBoard.
   * @property {(SignalValue<boolean> & (() => boolean))[]} bumperAnimating
   * @readonly
   * @private
   */
  private readonly bumperAnimating = [signalValue(false), signalValue(false), signalValue(false)];
  /**
   * Initializes PinballBoard and its owned resources from the supplied arguments.
   * @constructor
   * @returns {void}
   * @public
   */
  public constructor() {
    this.bumperAnimations = this.bumperSymbols.map((symbol) => ({
      ...GameLoader.getAtlas(symbol).getAnimation('idle'),
      loop: false
    }));
    this.bumperVisuals = this.bumperSymbols.map((symbol) => {
      const sprite = new Sprite(GameLoader.getImage(symbol), 80, 80, 0, 0, 0.5, 0.5);
      return sprite;
    });
    this.bumperIdleVisuals = this.bumperSymbols.map((symbol) => {
      const frame = GameLoader.getAtlas(symbol).getAnimation('idle').frames[0];
      if (!frame) throw new Error(`Pinball bumper animation for "${symbol}" has no frames.`);
      return new Sprite(GameLoader.getImage(symbol), frame.width, frame.height, 0, 0,
        0.5, 0.5, frame.x, frame.y, frame.width, frame.height);
    });
  }

  /**
   * Reads the responsive table bounds.
   * @returns {CollisionRect} Current table rectangle.
   */
  public get bounds(): CollisionRect { return this.layout(); }

  /**
   * Updates the reactive viewport configuration for this board.
   * @param {number} width Available logical canvas width.
   * @param {number} height Available logical canvas height.
   * @returns {void}
   */
  public resize(width: number, height: number): void {
    if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
      throw new RangeError('Pinball viewport dimensions must be positive and finite.');
    }
    this.viewport.set({ width, height });
  }

  /**
   * Returns shooter divider x from the current PinballBoard state.
   * @returns {number} shooter divider x from the current PinballBoard state.
   * @public
   */
  public get shooterDividerX(): number {
    const bounds = this.bounds;
    return bounds.x + bounds.width * 0.82;
  }

  /**
   * Returns shooter exit y from the current PinballBoard state.
   * @returns {number} shooter exit y from the current PinballBoard state.
   * @public
   */
  public get shooterExitY(): number {
    const bounds = this.bounds;
    return bounds.y + bounds.height * 0.2;
  }

  /**
   * Advances PinballBoard simulation and dependent presentation state for one frame.
   * @param {number} deltaSeconds Elapsed simulation time in seconds.
   * @returns {void}
   * @public
   */
  public update(deltaSeconds: number): void {
    for (let index = 0; index < this.bumperVisuals.length; index++) {
      if (!this.bumperAnimating[index]()) continue;
      const visual = this.bumperVisuals[index];
      visual.update(deltaSeconds);
      if (!visual.isAnimationPlaying) this.bumperAnimating[index].set(false);
    }
  }

  /**
   * Constructs bumpers for PinballBoard.
   * @param {CollisionRect} bounds Bounds used to position, constrain, or query the object.
   * @returns {readonly PinballBumper[]} Constructs bumpers for PinballBoard.
   * @private
   */
  private createBumpers(bounds: CollisionRect): readonly PinballBumper[] {
    const radius = Math.max(18, Math.min(31, bounds.width * 0.06));
    return [
      { x: bounds.x + bounds.width * 0.36, y: bounds.y + bounds.height * 0.25, radius },
      { x: bounds.x + bounds.width * 0.57, y: bounds.y + bounds.height * 0.22, radius },
      { x: bounds.x + bounds.width * 0.46, y: bounds.y + bounds.height * 0.39, radius: radius * 1.08 }
    ];
  }

  /**
   * Applies the ball radius operation to PinballBoard.
   * @returns {number} Applies the ball radius operation to PinballBoard.
   * @public
   */
  public ballRadius(): number { return Math.max(8, Math.min(12, this.bounds.width * 0.024)); }

  /**
   * Returns the resting ball center in the shooter lane.
   * @returns {PhysicsPoint} World-space launch position.
   * @public
   */
  public launchPosition(): PhysicsPoint {
    const bounds = this.bounds;
    return { x: bounds.x + bounds.width * 0.91, y: bounds.y + bounds.height * 0.86 };
  }

  /**
   * Starts the impact animation selected by a gameplay contact event.
   * @param {number} index Bumper index matching the geometry array.
   * @returns {void}
   */
  public playBumper(index: number): void {
    this.bumperAnimating[index].set(true);
    this.bumperVisuals[index].playAtlasClip(this.bumperAnimations[index]);
  }

  /**
   * Renders PinballBoard using its current geometry and presentation state.
   * @returns {void}
   * @public
   */
  public draw(): void {
    const bounds = this.bounds;
    const { x, y, width, height } = bounds;
    const dividerX = this.shooterDividerX;
    const exitY = this.shooterExitY;
    const context = GameContext.context;
    context.save();
    context.shadowColor = 'rgba(0, 0, 0, 0.72)';
    context.shadowBlur = 20;
    context.fillStyle = '#080d22';
    context.beginPath();
    context.roundRect(x - 12, y - 12, width + 24, height + 24, 22);
    context.fill();
    context.restore();

    // Layered chrome bezel and luminous outer trim.
    const bezel = context.createLinearGradient(x - 10, y, x + width + 10, y + height);
    bezel.addColorStop(0, '#8499b7'); bezel.addColorStop(0.18, '#253657');
    bezel.addColorStop(0.5, '#f6cb62'); bezel.addColorStop(0.78, '#304466'); bezel.addColorStop(1, '#9eb2c8');
    context.fillStyle = bezel;
    context.beginPath(); context.roundRect(x - 7, y - 7, width + 14, height + 14, 17); context.fill();
    context.fillStyle = '#101a37';
    context.beginPath(); context.roundRect(x - 2, y - 2, width + 4, height + 4, 13); context.fill();

    const playfieldGradient = context.createLinearGradient(x, y, x + width * 0.75, y + height);
    playfieldGradient.addColorStop(0, '#132b50'); playfieldGradient.addColorStop(0.48, '#101e3e'); playfieldGradient.addColorStop(1, '#201640');
    context.fillStyle = playfieldGradient;
    context.beginPath(); context.roundRect(x, y, width, height, 10); context.fill();
    context.save();
    context.beginPath(); context.roundRect(x + 3, y + 3, width - 6, height - 6, 8); context.clip();
    const nebula = context.createRadialGradient(x + width * 0.43, y + height * 0.47, 2, x + width * 0.43, y + height * 0.47, width * 0.55);
    nebula.addColorStop(0, 'rgba(78, 48, 137, 0.34)'); nebula.addColorStop(0.58, 'rgba(27, 80, 137, 0.17)'); nebula.addColorStop(1, 'rgba(7, 14, 36, 0)');
    context.fillStyle = nebula; context.fillRect(x, y, width, height);
    // Fixed deterministic stars: no per-frame random work or visual flicker.
    for (let index = 0; index < 46; index++) {
      const sx = x + width * (((index * 37) % 97) / 100);
      const sy = y + height * (((index * 61 + 13) % 101) / 105);
      context.globalAlpha = index % 5 === 0 ? 0.78 : 0.38;
      context.fillStyle = index % 7 === 0 ? '#80e8ff' : '#dbe9ff';
      context.beginPath(); context.arc(sx, sy, index % 9 === 0 ? 1.7 : 1, 0, Math.PI * 2); context.fill();
    }
    context.globalAlpha = 1;
    // A faint orbital map in the open field.
    context.strokeStyle = 'rgba(103, 175, 237, 0.14)'; context.lineWidth = 1.5;
    context.beginPath(); context.ellipse(x + width * 0.47, y + height * 0.48, width * 0.3, height * 0.21, -0.3, 0, Math.PI * 2); context.stroke();
    context.beginPath(); context.ellipse(x + width * 0.47, y + height * 0.48, width * 0.23, height * 0.15, 0.42, 0, Math.PI * 2); context.stroke();
    context.restore();

    // Right shooter lane; the opening at its top is where the launched ball joins play.
    const dividerStart = exitY + this.ballRadius() * 5;
    const laneX = dividerX + 5;
    const laneWidth = width - (dividerX - x) - 5;
    const laneGradient = context.createLinearGradient(laneX, 0, laneX + laneWidth, 0);
    laneGradient.addColorStop(0, '#0b1530'); laneGradient.addColorStop(1, '#070d20');
    context.fillStyle = laneGradient; context.fillRect(laneX, exitY, laneWidth, height - (exitY - y));
    GameContext.drawRect(dividerX, dividerStart, 5, y + height - dividerStart, '#f5c64f');
    GameContext.drawRect(dividerX + 7, dividerStart + 3, 2, y + height - dividerStart - 6, 'rgba(255, 239, 182, 0.8)');
    // Decorative curved orbit lane at left, with the same sampled rail segments used by physics.
    this.drawOrbitRails(bounds);
    // Perimeter rails and the open, playable drain at the bottom.
    GameContext.drawRect(x, y, dividerX - x, 4, '#50d5e8');
    GameContext.drawRect(x + width - 4, y, 4, height, '#50d5e8');
    GameContext.drawRect(x, y, 4, height, '#50d5e8');

    const bumpers = this.bumpers();
    for (let index = 0; index < bumpers.length; index++) {
      const bumper = bumpers[index];
      const color = index === 1 ? '#51ddff' : index === 2 ? '#ffe36f' : '#ff748e';
      context.save();
      context.shadowColor = color;
      context.shadowBlur = bumper.radius * 0.6;
      GameContext.drawCircle(bumper.x, bumper.y, bumper.radius + 7, '#07153d');
      context.restore();
      GameContext.drawCircle(bumper.x, bumper.y, bumper.radius + 3, '#f5c95b');
      GameContext.drawCircle(bumper.x, bumper.y, bumper.radius, '#061d3d');
      const visual = this.bumperAnimating[index]()
        ? this.bumperVisuals[index]
        : this.bumperIdleVisuals[index];
      visual.dimensions.setPosition(bumper.x, bumper.y);
      visual.dimensions.setSize(bumper.radius * 1.8, bumper.radius * 1.8);
      visual.draw();
    }

    const targets = this.targets();
    for (let index = 0; index < targets.length; index++) {
      const target = targets[index];
      GameContext.drawRect(target.x - 3, target.y - 3, target.width + 6, target.height + 6, '#07142e');
      GameContext.drawRect(target.x, target.y, target.width, target.height, index % 2 === 0 ? '#ffcd63' : '#54e1e7');
      GameContext.drawRect(target.x + 3, target.y + 3, target.width - 6, 3, 'rgba(255, 255, 255, 0.72)');
    }
    this.drawSlingshots(bounds);

    const start = this.launchPosition();
    GameContext.drawRect(start.x - 3, start.y + this.ballRadius(), 6, height * 0.1, '#8db9db');
  }

  /**
   * Constructs targets for PinballBoard.
   * @param {CollisionRect} bounds Bounds used to position, constrain, or query the object.
   * @returns {readonly CollisionRect[]} Constructs targets for PinballBoard.
   * @private
   */
  private createTargets(bounds: CollisionRect): readonly CollisionRect[] {
    const targets: CollisionRect[] = [];
    const targetWidth = Math.max(11, bounds.width * 0.035);
    const targetHeight = Math.max(20, bounds.height * 0.052);
    const rowY = bounds.y + bounds.height * 0.52;
    for (let index = 0; index < 4; index++) {
      targets.push({
        x: bounds.x + bounds.width * (0.25 + index * 0.11),
        y: rowY,
        width: targetWidth,
        height: targetHeight
      });
    }
    return targets;
  }

  /**
   * Constructs walls for PinballBoard.
   * @param {CollisionRect} bounds Bounds used to position, constrain, or query the object.
   * @returns {readonly CollisionRect[]} Constructs walls for PinballBoard.
   * @private
   */
  private createWalls(bounds: CollisionRect): readonly CollisionRect[] {
    const wall = Math.max(8, bounds.width * 0.025);
    const dividerX = bounds.x + bounds.width * 0.82;
    const exitY = bounds.y + bounds.height * 0.2;
    const dividerStartY = exitY + Math.max(8, Math.min(12, bounds.width * 0.024)) * 5;
    return [
      { x: bounds.x - wall, y: bounds.y - wall, width: wall, height: bounds.height + wall },
      { x: bounds.x + bounds.width, y: bounds.y - wall, width: wall, height: bounds.height + wall },
      { x: bounds.x - wall, y: bounds.y - wall, width: dividerX - bounds.x + wall, height: wall },
      { x: dividerX, y: dividerStartY, width: wall, height: bounds.y + bounds.height - dividerStartY }
    ];
  }

  /**
   * Constructs rails for PinballBoard.
   * @param {CollisionRect} bounds Bounds used to position, constrain, or query the object.
   * @returns {readonly (readonly [number, number, number, number])[]} Constructs rails for PinballBoard.
   * @private
   */
  private createRails(bounds: CollisionRect): readonly (readonly [number, number, number, number])[] {
    const { x, y, width, height } = bounds;
    const paths = [
      // Left orbit: runs down the outer lane then bends into the lower playfield.
      [[0.19, 0.035], [0.035, 0.05], [0.055, 0.36], [0.07, 0.60]],
      [[0.07, 0.60], [0.09, 0.73], [0.23, 0.79], [0.31, 0.84]],
      // Inner edge of the orbit keeps the ball in a real channel rather than drawing a fake rail.
      [[0.25, 0.12], [0.16, 0.18], [0.17, 0.47], [0.22, 0.63]],
      [[0.22, 0.63], [0.24, 0.71], [0.31, 0.74], [0.36, 0.78]],
      // Upper curved lane guides the ball around the bumper cluster.
      [[0.19, 0.035], [0.43, -0.025], [0.72, 0.02], [0.79, 0.18]]
    ] as const;
    const segments: [number, number, number, number][] = [];
    for (const [p0, p1, p2, p3] of paths) {
      let previousX = x + width * p0[0]; let previousY = y + height * p0[1];
      for (let step = 1; step <= 16; step++) {
        const t = step / 16; const inverse = 1 - t;
        const px = x + width * (inverse ** 3 * p0[0] + 3 * inverse ** 2 * t * p1[0] + 3 * inverse * t ** 2 * p2[0] + t ** 3 * p3[0]);
        const py = y + height * (inverse ** 3 * p0[1] + 3 * inverse ** 2 * t * p1[1] + 3 * inverse * t ** 2 * p2[1] + t ** 3 * p3[1]);
        segments.push([previousX, previousY, px, py]); previousX = px; previousY = py;
      }
    }
    return segments;
  }

  /**
   * Renders orbit rails for PinballBoard.
   * @param {CollisionRect} bounds Bounds used to position, constrain, or query the object.
   * @returns {void}
   * @private
   */
  private drawOrbitRails(bounds: CollisionRect): void {
    const { x, y, width, height } = bounds;
    const context = GameContext.context;
    context.save(); context.lineCap = 'round'; context.lineJoin = 'round';
    // Track bed is wider than the collision spine, like a raised metal guide channel.
    context.strokeStyle = 'rgba(73, 119, 171, 0.56)'; context.lineWidth = Math.max(12, width * 0.055);
    context.beginPath();
    context.moveTo(x + width * 0.19, y + height * 0.035);
    context.bezierCurveTo(x + width * 0.035, y + height * 0.05, x + width * 0.055, y + height * 0.36, x + width * 0.07, y + height * 0.60);
    context.bezierCurveTo(x + width * 0.09, y + height * 0.73, x + width * 0.23, y + height * 0.79, x + width * 0.31, y + height * 0.84);
    context.stroke();
    context.strokeStyle = '#67d9ed'; context.lineWidth = Math.max(2, width * 0.009);
    context.beginPath();
    context.moveTo(x + width * 0.19, y + height * 0.035);
    context.bezierCurveTo(x + width * 0.035, y + height * 0.05, x + width * 0.055, y + height * 0.36, x + width * 0.07, y + height * 0.60);
    context.bezierCurveTo(x + width * 0.09, y + height * 0.73, x + width * 0.23, y + height * 0.79, x + width * 0.31, y + height * 0.84);
    context.stroke();
    context.strokeStyle = 'rgba(166, 197, 231, 0.75)'; context.lineWidth = Math.max(2, width * 0.006);
    context.beginPath();
    context.moveTo(x + width * 0.25, y + height * 0.12);
    context.bezierCurveTo(x + width * 0.16, y + height * 0.18, x + width * 0.17, y + height * 0.47, x + width * 0.22, y + height * 0.63);
    context.bezierCurveTo(x + width * 0.24, y + height * 0.71, x + width * 0.31, y + height * 0.74, x + width * 0.36, y + height * 0.78);
    context.stroke();
    context.strokeStyle = 'rgba(93, 211, 237, 0.68)'; context.lineWidth = Math.max(3, width * 0.013);
    context.beginPath(); context.moveTo(x + width * 0.19, y + height * 0.035);
    context.bezierCurveTo(x + width * 0.43, y - height * 0.025, x + width * 0.72, y + height * 0.02, x + width * 0.79, y + height * 0.18); context.stroke();
    context.restore();
  }

  /**
   * Constructs convex outlines matching both visible slingshots.
   * @param {CollisionRect} bounds Responsive table geometry.
   * @returns {readonly PhysicsPoint[][]} World-space convex polygon vertices.
   * @private
   */
  private createSlingshots(bounds: CollisionRect): readonly PhysicsPoint[][] {
    const { x, y, width, height } = bounds;
    const top = y + height * 0.68, end = top + height * 0.06;
    return [
      [{ x: x + width * 0.1, y: top - height * 0.025 }, { x: x + width * 0.25, y: top },
        { x: x + width * 0.24, y: end }, { x: x + width * 0.12, y: end - height * 0.01 }],
      [{ x: x + width * 0.72, y: top }, { x: x + width * 0.87, y: top - height * 0.025 },
        { x: x + width * 0.87, y: end - height * 0.01 }, { x: x + width * 0.73, y: end }]
    ];
  }

  /**
   * Renders slingshots for PinballBoard.
   * @param {CollisionRect} bounds Bounds used to position, constrain, or query the object.
   * @returns {void}
   * @private
   */
  private drawSlingshots(bounds: CollisionRect): void {
    const context = GameContext.context;
    context.save();
    try {
      context.lineJoin = 'round'; context.fillStyle = '#183b63'; context.strokeStyle = '#e3b456';
      context.lineWidth = Math.max(3, bounds.width * 0.01);
      context.beginPath();
      for (const points of this.slingshots()) {
        context.moveTo(points[0].x, points[0].y);
        for (const point of points.slice(1)) context.lineTo(point.x, point.y);
        context.closePath();
      }
      context.fill(); context.stroke();
    } finally { context.restore(); }
  }
}
