import { computedValue, signalValue } from 'reactive-values';
import { GameContext, type CollisionRect } from '../../engine';
import type { PachinkoPeg } from './';

/**
 * Owns responsive geometry shared by board rendering and scene physics.
 * @class PachinkoBoard
 */
export default class {
  /**
   * Viewport configuration scoped to this board, avoiding global subscriptions.
   * @property {SignalValue<object>} viewport
   * @private
   */
  private readonly viewport = signalValue({ width: GameContext.gameDimensionsModel.getWidth(), height: GameContext.gameDimensionsModel.getHeight() });
  /**
   * Responsive board bounds derived from viewport size without a manual cache.
   * @property {ComputedValue<CollisionRect>} layout
   */
  public readonly layout = computedValue<CollisionRect>(() => {
    const viewport = this.viewport();
    const width = Math.min(viewport.width * 0.78, 540);
    const height = Math.min(viewport.height * 0.64, 570);
    return { x: (viewport.width - width) * 0.5,
      y: Math.max(92, (viewport.height - height) * 0.5), width, height };
  }, [this.viewport]);
  /**
   * Peg centers and radii shared by rendering and collision construction.
   * @property {ComputedValue<readonly PachinkoPeg[]>} pegs
   */
  public readonly pegs = computedValue(() => this.createPegs(this.bounds), [this.viewport]);
  /**
   * Full-height outer barriers shared by rendering and physics.
   * @property {ComputedValue<readonly CollisionRect[]>} rails
   */
  public readonly rails = computedValue(() => this.createRails(this.bounds), [this.viewport]);
  /**
   * Lane divider rectangles used to construct matching convex polygons.
   * @property {ComputedValue<readonly CollisionRect[]>} laneWalls
   */
  public readonly laneWalls = computedValue(() => this.createLaneWalls(this.bounds), [this.viewport]);

  /**
   * Exposes the current responsive board rectangle.
   * @returns {CollisionRect} Current board bounds.
   */
  public get bounds(): CollisionRect { return this.layout(); }

  /**
   * Updates this board's reactive viewport configuration.
   * @param {number} width Available logical canvas width.
   * @param {number} height Available logical canvas height.
   * @returns {void}
   */
  public resize(width: number, height: number): void {
    if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
      throw new RangeError('Pachinko viewport dimensions must be positive and finite.');
    }
    this.viewport.set({ width, height });
  }

  /**
   * Returns lane count from the current PachinkoBoard state.
   * @returns {number} lane count from the current PachinkoBoard state.
   * @public
   */
  public get laneCount(): number { return 9; }
  /**
   * Returns lane top from the current PachinkoBoard state.
   * @returns {number} lane top from the current PachinkoBoard state.
   * @public
   */
  public get laneTop(): number { return this.bounds.y + this.bounds.height - 54; }
  /**
   * Returns lane bottom from the current PachinkoBoard state.
   * @returns {number} lane bottom from the current PachinkoBoard state.
   * @public
   */
  public get laneBottom(): number { return this.bounds.y + this.bounds.height; }

  /**
   * Applies the lane at operation to PachinkoBoard.
   * @param {number} x Horizontal coordinate in the owning coordinate space.
   * @returns {number} Applies the lane at operation to PachinkoBoard.
   * @public
   */
  public laneAt(x: number): number {
    const bounds = this.bounds;
    return Math.max(0, Math.min(9 - 1, Math.floor((x - bounds.x) / (bounds.width / 9))));
  }

  /**
   * Applies the lane center operation to PachinkoBoard.
   * @param {number} index Index identifying the item within its collection.
   * @returns {number} Applies the lane center operation to PachinkoBoard.
   * @public
   */
  public laneCenter(index: number): number {
    const bounds = this.bounds;
    return bounds.x + bounds.width * (index + 0.5) / 9;
  }

  /**
   * Launches y for PachinkoBoard.
   * @param {number} radius Radius of the circular shape.
   * @returns {number} Launches y for PachinkoBoard.
   * @public
   */
  public launchY(radius: number): number {
    return this.bounds.y + 14 + radius;
  }

  /**
   * Renders PachinkoBoard using its current geometry and presentation state.
   * @param {number} selectedLane The selected lane supplied to this operation.
   * @param {readonly number[]} payouts The payouts supplied to this operation.
   * @returns {void}
   * @public
   */
  public draw(selectedLane: number, payouts: readonly number[]): void {
    const bounds = this.bounds;
    const { x, y, width, height } = bounds;
    const slotTop = this.laneTop;
    GameContext.drawRect(x - 8, y - 8, width + 16, height + 16, '#e5b954');
    GameContext.drawRect(x, y, width, height, 'rgba(12, 19, 44, 0.92)');
    GameContext.drawRect(x, slotTop, width, y + height - slotTop, '#11172e');

    this.pegs().forEach((peg) => {
      GameContext.drawCircle(peg.x + 1, peg.y + 2, peg.radius + 1, 'rgba(0, 0, 0, 0.45)');
      GameContext.drawCircle(peg.x, peg.y, peg.radius, '#f0d88a');
      GameContext.drawCircle(peg.x - peg.radius * 0.25, peg.y - peg.radius * 0.3, peg.radius * 0.3, '#ffffff');
    });

    const laneWidth = width / 9;
    const context = GameContext.context;
    context.save();
    try {
      context.fillStyle = '#7588aa';
      for (const wall of this.laneWalls()) {
        context.beginPath();
        context.moveTo(wall.x + wall.width / 2, wall.y);
        context.lineTo(wall.x + wall.width, wall.y + 4);
        context.lineTo(wall.x + wall.width, wall.y + wall.height);
        context.lineTo(wall.x, wall.y + wall.height);
        context.lineTo(wall.x, wall.y + 4);
        context.closePath(); context.fill();
      }
    } finally { context.restore(); }
    payouts.forEach((multiplier, index) => {
      const laneX = x + laneWidth * index;
      if (index === selectedLane) {
        GameContext.drawRect(laneX + 2, slotTop + 2, laneWidth - 4, height - (slotTop - y) - 4, '#ab6f2f');
      }
      GameContext.drawText(
        `${multiplier}x`,
        laneX + laneWidth / 2,
        y + height - 13,
        Math.max(11, Math.min(16, laneWidth * 0.28)),
        multiplier === 0 ? '#b5bfd1' : '#fff0b0',
        'center',
        laneWidth - 3
      );
    });
  }

  /**
   * Constructs pegs for PachinkoBoard.
   * @param {CollisionRect} bounds Bounds used to position, constrain, or query the object.
   * @returns {PachinkoPeg[]} Constructs pegs for PachinkoBoard.
   * @private
   */
  private createPegs(bounds: CollisionRect): PachinkoPeg[] {
    const spacingX = bounds.width / 10;
    const spacingY = (bounds.height - 142) / 8;
    const radius = Math.max(3, Math.min(6, spacingX * 0.12));
    const pegs: PachinkoPeg[] = [];
    for (let row = 0; row < 8; row++) {
      for (let column = 0; column < 9; column++) {
        pegs.push({
          x: bounds.x + spacingX * (column + 0.5 + (row % 2) * 0.5),
          y: bounds.y + 38 + row * spacingY,
          radius
        });
      }
    }
    return pegs;
  }

  /**
   * Constructs rails for PachinkoBoard.
   * @param {CollisionRect} bounds Bounds used to position, constrain, or query the object.
   * @returns {CollisionRect[]} Constructs rails for PachinkoBoard.
   * @private
   */
  private createRails(bounds: CollisionRect): CollisionRect[] {
    const sideRailWidth = Math.max(6, bounds.width * 0.018);
    const railHeight = bounds.height + 40;
    return [
      { x: bounds.x - sideRailWidth, y: bounds.y, width: sideRailWidth, height: railHeight },
      { x: bounds.x + bounds.width, y: bounds.y, width: sideRailWidth, height: railHeight }
    ];
  }

  /**
   * Constructs lane walls for PachinkoBoard.
   * @param {CollisionRect} bounds Bounds used to position, constrain, or query the object.
   * @returns {CollisionRect[]} Constructs lane walls for PachinkoBoard.
   * @private
   */
  private createLaneWalls(bounds: CollisionRect): CollisionRect[] {
    const slotTop = bounds.y + bounds.height - 54;
    const laneWidth = bounds.width / 9;
    const wallWidth = Math.max(2, bounds.width * 0.004);
    const walls: CollisionRect[] = [];
    for (let index = 1; index < 9; index++) {
      walls.push({
        x: bounds.x + laneWidth * index - wallWidth * 0.5,
        y: slotTop,
        width: wallWidth,
        height: bounds.height - (slotTop - bounds.y)
      });
    }
    return walls;
  }
}
