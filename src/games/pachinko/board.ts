import {
  Collision2D,
  GameContext,
  type CollisionRect
} from '../../engine';
import { PachinkoBall } from './';

/**
 * Defines the pachinko peg contract shared by its consumers.
 * @interface PachinkoPeg
 */
export interface PachinkoPeg {
  /**
   * Horizontal coordinate in the owning coordinate space.
   * @property {number} x
   */
  x: number;
  /**
   * Vertical coordinate in the owning coordinate space.
   * @property {number} y
   */
  y: number;
  /**
   * Radius of the circular shape.
   * @property {number} radius
   */
  radius: number;
}

/**
 * Defines the pachinko bounds contract shared by its consumers.
 * @interface PachinkoBounds
 */
export interface PachinkoBounds {
  /**
   * Horizontal coordinate in the owning coordinate space.
   * @property {number} x
   */
  x: number;
  /**
   * Vertical coordinate in the owning coordinate space.
   * @property {number} y
   */
  y: number;
  /**
   * Width of the represented area.
   * @property {number} width
   */
  width: number;
  /**
   * Height of the represented area.
   * @property {number} height
   */
  height: number;
}

/**
 * Shared values used to configure board.
 * @constant
 */
const LANE_COUNT = 9;
/**
 * Shared values used to configure board.
 * @constant
 */
const ROW_COUNT = 8;

/**
 * Owns responsive peg geometry, board collisions, and payout-lane layout.
 * @class PachinkoBoard
 */
export default class {
  /**
   * Bounds cache configuration or state owned by PachinkoBoard.
   * @property {PachinkoBounds | undefined} boundsCache
   * @private
   */
  private boundsCache: PachinkoBounds | undefined;
  /**
   * Pegs cache configuration or state owned by PachinkoBoard.
   * @property {readonly PachinkoPeg[]} pegsCache
   * @private
   */
  private pegsCache: readonly PachinkoPeg[] = [];
  /**
   * Rail cache configuration or state owned by PachinkoBoard.
   * @property {readonly CollisionRect[]} railCache
   * @private
   */
  private railCache: readonly CollisionRect[] = [];
  /**
   * Lane wall cache configuration or state owned by PachinkoBoard.
   * @property {readonly CollisionRect[]} laneWallCache
   * @private
   */
  private laneWallCache: readonly CollisionRect[] = [];

  /**
   * Returns bounds from the current PachinkoBoard state.
   * @returns {PachinkoBounds} bounds from the current PachinkoBoard state.
   * @public
   */
  public get bounds(): PachinkoBounds {
    const viewport = GameContext.gameDimensionsModel;
    const width = Math.min(viewport.getWidth() * 0.78, 540);
    const height = Math.min(viewport.getHeight() * 0.64, 570);
    const next = {
      x: (viewport.getWidth() - width) * 0.5,
      y: Math.max(92, (viewport.getHeight() - height) * 0.5),
      width,
      height
    };
    if (
      this.boundsCache === undefined
      || this.boundsCache.x !== next.x
      || this.boundsCache.y !== next.y
      || this.boundsCache.width !== next.width
      || this.boundsCache.height !== next.height
    ) {
      this.boundsCache = next;
      this.pegsCache = this.createPegs(next);
      this.railCache = this.createRails(next);
      this.laneWallCache = this.createLaneWalls(next);
    }
    return this.boundsCache;
  }

  /**
   * Returns lane count from the current PachinkoBoard state.
   * @returns {number} lane count from the current PachinkoBoard state.
   * @public
   */
  public get laneCount(): number { return LANE_COUNT; }
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
    return Math.max(0, Math.min(LANE_COUNT - 1, Math.floor((x - bounds.x) / (bounds.width / LANE_COUNT))));
  }

  /**
   * Applies the lane center operation to PachinkoBoard.
   * @param {number} index Index identifying the item within its collection.
   * @returns {number} Applies the lane center operation to PachinkoBoard.
   * @public
   */
  public laneCenter(index: number): number {
    const bounds = this.bounds;
    return bounds.x + bounds.width * (index + 0.5) / LANE_COUNT;
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
   * Resolves pachinko board for PachinkoBoard.
   * @param {PachinkoBall} ball The ball supplied to this operation.
   * @returns {void}
   * @public
   */
  public resolve(ball: PachinkoBall): void {
    const body = ball.body;
    const bounds = this.bounds;
    let touchingPeg = false;
    for (let index = 0; index < this.pegsCache.length; index++) {
      const peg = this.pegsCache[index];
      if (!Collision2D.resolveCircleAgainstCircle(body, peg.x, peg.y, peg.radius, 0.68)) continue;
      touchingPeg = true;
      ball.deflectFromPeg(peg.x, index);
    }
    if (!touchingPeg) ball.clearPegContact();
    for (const rail of this.railCache) Collision2D.resolveCircleAgainstRect(body, rail, 0.68);
    for (const wall of this.laneWallCache) Collision2D.resolveCircleAgainstRect(body, wall, 0.35);
    Collision2D.resolveCircleAgainstHorizontalBounds(body, bounds.x, bounds.x + bounds.width, 0.55);
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

    this.pegsCache.forEach((peg) => {
      GameContext.drawCircle(peg.x + 1, peg.y + 2, peg.radius + 1, 'rgba(0, 0, 0, 0.45)');
      GameContext.drawCircle(peg.x, peg.y, peg.radius, '#f0d88a');
      GameContext.drawCircle(peg.x - peg.radius * 0.25, peg.y - peg.radius * 0.3, peg.radius * 0.3, '#ffffff');
    });

    const laneWidth = width / LANE_COUNT;
    for (let index = 0; index <= LANE_COUNT; index++) {
      const dividerX = x + laneWidth * index;
      GameContext.drawRect(dividerX - 1.5, slotTop, 3, y + height - slotTop, '#7588aa');
    }
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
   * @param {PachinkoBounds} bounds Bounds used to position, constrain, or query the object.
   * @returns {PachinkoPeg[]} Constructs pegs for PachinkoBoard.
   * @private
   */
  private createPegs(bounds: PachinkoBounds): PachinkoPeg[] {
    const spacingX = bounds.width / 10;
    const spacingY = (bounds.height - 142) / ROW_COUNT;
    const radius = Math.max(3, Math.min(6, spacingX * 0.12));
    const pegs: PachinkoPeg[] = [];
    for (let row = 0; row < ROW_COUNT; row++) {
      for (let column = 0; column < LANE_COUNT; column++) {
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
   * @param {PachinkoBounds} bounds Bounds used to position, constrain, or query the object.
   * @returns {CollisionRect[]} Constructs rails for PachinkoBoard.
   * @private
   */
  private createRails(bounds: PachinkoBounds): CollisionRect[] {
    const sideRailWidth = Math.max(6, bounds.width * 0.018);
    const railHeight = this.laneTop - bounds.y;
    return [
      { x: bounds.x - sideRailWidth, y: bounds.y, width: sideRailWidth, height: railHeight },
      { x: bounds.x + bounds.width, y: bounds.y, width: sideRailWidth, height: railHeight }
    ];
  }

  /**
   * Constructs lane walls for PachinkoBoard.
   * @param {PachinkoBounds} bounds Bounds used to position, constrain, or query the object.
   * @returns {CollisionRect[]} Constructs lane walls for PachinkoBoard.
   * @private
   */
  private createLaneWalls(bounds: PachinkoBounds): CollisionRect[] {
    const slotTop = bounds.y + bounds.height - 54;
    const laneWidth = bounds.width / LANE_COUNT;
    const wallWidth = Math.max(2, bounds.width * 0.004);
    const walls: CollisionRect[] = [];
    for (let index = 1; index < LANE_COUNT; index++) {
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
