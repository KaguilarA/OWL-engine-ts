import { computedValue, signalValue, type ComputedValue, type SignalValue } from 'reactive-values';
import { Dimensions, GameContext } from '../core';
import type { CollisionRect, TilemapOptions } from '../interfaces';

/**
 * Grid-based tilemap using zero for empty cells and one-based tileset indices.
 * @class Tilemap
 */
export default class {
  /**
   * Dimensions configuration or state owned by Tilemap.
   * @property {default} dimensions
   * @readonly
   * @public
   */
  public readonly dimensions: Dimensions;
  /**
   * Map width configuration or state owned by Tilemap.
   * @property {number} mapWidth
   * @readonly
   * @public
   */
  public readonly mapWidth: number;
  /**
   * Map height configuration or state owned by Tilemap.
   * @property {number} mapHeight
   * @readonly
   * @public
   */
  public readonly mapHeight: number;
  /**
   * Image source used to render the associated content.
   * @property {CanvasImageSource} image
   * @readonly
   * @private
   */
  private readonly image: CanvasImageSource;
  /**
   * Number or contents of the grid columns.
   * @property {number} columns
   * @readonly
   * @private
   */
  private readonly columns: number;
  /**
   * Tile width configuration or state owned by Tilemap.
   * @property {number} tileWidth
   * @readonly
   * @private
   */
  private readonly tileWidth: number;
  /**
   * Tile height configuration or state owned by Tilemap.
   * @property {number} tileHeight
   * @readonly
   * @private
   */
  private readonly tileHeight: number;
  /**
   * Spacing configuration or state owned by Tilemap.
   * @property {number} spacing
   * @readonly
   * @private
   */
  private readonly spacing: number;
  /**
   * Margin configuration or state owned by Tilemap.
   * @property {number} margin
   * @readonly
   * @private
   */
  private readonly margin: number;
  /**
   * Draw tile width configuration or state owned by Tilemap.
   * @property {number} drawTileWidth
   * @readonly
   * @private
   */
  private readonly drawTileWidth: number;
  /**
   * Draw tile height configuration or state owned by Tilemap.
   * @property {number} drawTileHeight
   * @readonly
   * @private
   */
  private readonly drawTileHeight: number;
  /**
   * Tileset width configuration or state owned by Tilemap.
   * @property {number} tilesetWidth
   * @readonly
   * @private
   */
  private readonly tilesetWidth: number;
  /**
   * Tileset height configuration or state owned by Tilemap.
   * @property {number} tilesetHeight
   * @readonly
   * @private
   */
  private readonly tilesetHeight: number;
  /**
   * Cells configuration or state owned by Tilemap.
   * @property {SignalValue<readonly number[]>} cells
   * @readonly
   * @private
   */
  private readonly cells: SignalValue<readonly number[]>;
  /**
   * Immutable cell snapshot derived from the tile source, enabling reactive collision adapters.
   * @property {ComputedValue<readonly number[]>} tiles
   */
  public readonly tiles: ComputedValue<readonly number[]>;

  /**
   * Initializes Tilemap and its owned resources from the supplied arguments.
   * @constructor
   * @param {TilemapOptions} options Configuration controlling construction or behavior.
   * @returns {void}
   * @public
   */
  public constructor(options: TilemapOptions) {
    this.assertPositiveInteger(options.columns, 'columns');
    this.assertPositiveInteger(options.tileWidth, 'tileWidth');
    this.assertPositiveInteger(options.tileHeight, 'tileHeight');
    this.assertPositiveInteger(options.mapWidth, 'mapWidth');
    this.assertPositiveInteger(options.mapHeight, 'mapHeight');
    this.image = options.image;
    const source = options.image as CanvasImageSource & {
      /**
       * Natural width configuration or state owned by Tilemap.
       * @property {number | undefined} naturalWidth
       */
      naturalWidth?: number;
      /**
       * Natural height configuration or state owned by Tilemap.
       * @property {number | undefined} naturalHeight
       */
      naturalHeight?: number;
      /**
       * Video width configuration or state owned by Tilemap.
       * @property {number | undefined} videoWidth
       */
      videoWidth?: number;
      /**
       * Video height configuration or state owned by Tilemap.
       * @property {number | undefined} videoHeight
       */
      videoHeight?: number;
      /**
       * Width of the represented area.
       * @property {number | undefined} width
       */
      width?: number;
      /**
       * Height of the represented area.
       * @property {number | undefined} height
       */
      height?: number;
    };
    this.tilesetWidth = source.naturalWidth ?? source.videoWidth ?? source.width ?? 0;
    this.tilesetHeight = source.naturalHeight ?? source.videoHeight ?? source.height ?? 0;
    this.columns = options.columns;
    this.tileWidth = options.tileWidth;
    this.tileHeight = options.tileHeight;
    this.spacing = options.spacing ?? 0;
    this.margin = options.margin ?? 0;
    this.drawTileWidth = options.drawTileWidth ?? options.tileWidth;
    this.drawTileHeight = options.drawTileHeight ?? options.tileHeight;
    if (this.spacing < 0 || this.margin < 0) throw new RangeError('Tile spacing and margin cannot be negative.');
    this.mapWidth = options.mapWidth;
    this.mapHeight = options.mapHeight;
    this.cells = signalValue<readonly number[]>(Array.from({ length: this.mapWidth * this.mapHeight }, () => 0));
    this.tiles = computedValue(() => Object.freeze([...this.cells()]), [this.cells]);
    this.dimensions = new Dimensions(
      this.mapWidth * this.drawTileWidth,
      this.mapHeight * this.drawTileHeight,
      options.x ?? 0,
      options.y ?? 0
    );
  }

  /**
   * Returns the tileset index at a validated map cell.
   * @param {number} x Horizontal coordinate in the owning coordinate space.
   * @param {number} y Vertical coordinate in the owning coordinate space.
   * @returns {number} the tileset index at a validated map cell.
   * @public
   */
  public getTile(x: number, y: number): number {
    this.assertCell(x, y);
    return this.cells()[y * this.mapWidth + x];
  }

  /**
   * Computes a cell's actual world rectangle using the same origin and signed scale as rendering.
   * @param {number} x Cell column.
   * @param {number} y Cell row.
   * @returns {CollisionRect} Normalized world-space cell bounds.
   */
  public getCellBounds(x: number, y: number): CollisionRect {
    this.assertCell(x, y);
    const width = this.drawTileWidth * this.dimensions.getScaleX();
    const height = this.drawTileHeight * this.dimensions.getScaleY();
    const originX = this.dimensions.getX() + x * width, originY = this.dimensions.getY() + y * height;
    return { x: Math.min(originX, originX + width), y: Math.min(originY, originY + height), width: Math.abs(width), height: Math.abs(height) };
  }

  /**
   * Updates the tileset index at one validated map cell.
   * @param {number} x Horizontal coordinate in the owning coordinate space.
   * @param {number} y Vertical coordinate in the owning coordinate space.
   * @param {number} tileIndex Tileset index assigned to the selected cell; zero represents an empty cell.
   * @returns {void}
   * @public
   */
  public setTile(x: number, y: number, tileIndex: number): void {
    this.assertCell(x, y);
    if (!Number.isInteger(tileIndex) || tileIndex < 0) {
      throw new RangeError('Tile index must be a non-negative integer.');
    }
    const cells = this.cells().slice();
    cells[y * this.mapWidth + x] = tileIndex;
    this.cells.set(cells);
  }

  /**
   * Fills the tilemap with a single tileset index.
   * @param {number} tileIndex Tileset index assigned to the selected cell; zero represents an empty cell.
   * @returns {void}
   * @public
   */
  public fill(tileIndex: number): void {
    if (!Number.isInteger(tileIndex) || tileIndex < 0) {
      throw new RangeError('Tile index must be a non-negative integer.');
    }
    this.cells.set(this.cells().map(() => tileIndex));
  }

  /**
   * Replaces the map’s tile indices with the supplied cell data.
   * @param {ArrayLike<number>} tiles The tiles supplied to this operation.
   * @returns {void}
   * @public
   */
  public setTiles(tiles: ArrayLike<number>): void {
    const current = this.cells();
    if (tiles.length !== current.length) {
      throw new RangeError(`Tile data must contain exactly ${current.length} cells.`);
    }
    const next = new Array<number>(tiles.length);
    for (let index = 0; index < tiles.length; index++) {
      const tile = tiles[index];
      if (tile === undefined || !Number.isInteger(tile) || tile < 0) {
        throw new RangeError(`Tile at index ${index} must be a non-negative integer.`);
      }
      next[index] = tile;
    }
    this.cells.set(next);
  }

  /**
   * Renders Tilemap using its current geometry and presentation state.
   * @returns {void}
   * @public
   */
  public draw(): void {
    const context = GameContext.context;
    const cells = this.cells();
    const originX = this.dimensions.getX();
    const originY = this.dimensions.getY();
    const scaleX = this.dimensions.getScaleX();
    const scaleY = this.dimensions.getScaleY();
    context.save();
    context.translate(originX, originY);
    context.scale(scaleX, scaleY);
    try {
      this.drawTiles(context, cells);
    } finally {
      context.restore();
    }
  }

  /**
   * Draws each non-empty map cell using its one-based tileset index.
   * @private
   * @param {CanvasRenderingContext2D} context Canvas used for rendering.
   * @param {readonly number[]} cells Tile indices for the complete map.
   * @return {void}
   */
  private drawTiles(context: CanvasRenderingContext2D, cells: readonly number[]): void {
    for (let y = 0; y < this.mapHeight; y++) {
      for (let x = 0; x < this.mapWidth; x++) {
        const tile = cells[y * this.mapWidth + x];
        if (tile > 0) this.drawTile(context, tile, x, y);
      }
    }
  }

  /**
   * Draws a map cell after validating its source rectangle against the tileset.
   * @private
   * @param {CanvasRenderingContext2D} context Canvas used for rendering.
   * @param {number} tile One-based tileset index.
   * @param {number} x Horizontal map cell coordinate.
   * @param {number} y Vertical map cell coordinate.
   * @return {void}
   */
  private drawTile(context: CanvasRenderingContext2D, tile: number, x: number, y: number): void {
    const index = tile - 1;
    const sourceX = this.margin + (index % this.columns) * (this.tileWidth + this.spacing);
    const sourceY = this.margin + Math.floor(index / this.columns) * (this.tileHeight + this.spacing);
    if (sourceX + this.tileWidth > this.tilesetWidth || sourceY + this.tileHeight > this.tilesetHeight) {
      throw new RangeError(`Tile index ${tile} exceeds the tileset image bounds.`);
    }
    context.drawImage(
      this.image,
      sourceX,
      sourceY,
      this.tileWidth,
      this.tileHeight,
      x * this.drawTileWidth,
      y * this.drawTileHeight,
      this.drawTileWidth,
      this.drawTileHeight
    );
  }

  /**
   * Rejects grid coordinates that do not address a valid map cell.
   * @param {number} x Horizontal coordinate in the owning coordinate space.
   * @param {number} y Vertical coordinate in the owning coordinate space.
   * @returns {void}
   * @private
   */
  private assertCell(x: number, y: number): void {
    if (!Number.isInteger(x) || !Number.isInteger(y) || x < 0 || y < 0 || x >= this.mapWidth || y >= this.mapHeight) {
      throw new RangeError(`Tile coordinate (${x}, ${y}) is outside the map.`);
    }
  }

  /**
   * Rejects non-integer or non-positive configuration values.
   * @param {number} value Value to read, validate, format, or assign.
   * @param {string} name Name used to identify or look up this resource.
   * @returns {void}
   * @private
   */
  private assertPositiveInteger(value: number, name: string): void {
    if (!Number.isInteger(value) || value <= 0) throw new RangeError(`${name} must be a positive integer.`);
  }
}
