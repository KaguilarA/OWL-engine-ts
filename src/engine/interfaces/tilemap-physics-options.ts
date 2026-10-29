/**
 * Rules mapping reactive tile indices and transforms to owned colliders; refresh explicitly when external rule data changes.
 * @interface TilemapPhysicsOptions
 */
export interface TilemapPhysicsOptions {
  /**
   * Selects collidable cells; nonzero cells are selected by default.
   * @property {Function | undefined} isSolid
   */
  isSolid?: (tile: number, x: number, y: number) => boolean;
  /**
   * Selects upper-face-only platforms among the collidable cells.
   * @property {Function | undefined} isOneWay
   */
  isOneWay?: (tile: number, x: number, y: number) => boolean;
  /**
   * Selects trigger cells that report contacts without blocking motion.
   * @property {Function | undefined} isSensor
   */
  isSensor?: (tile: number, x: number, y: number) => boolean;
  /**
   * Category bitset assigned to generated colliders.
   * @property {number | undefined} layer
   */
  layer?: number;
  /**
   * Accepted category bitset assigned to generated colliders.
   * @property {number | undefined} mask
   */
  mask?: number;
}
