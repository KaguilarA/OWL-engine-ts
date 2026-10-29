import { signalValue, type SignalValue } from 'reactive-values';

/**
 * Reactive rectangular cell storage for board, puzzle, and tactics games.
 * @class GridBoard
 */
export default class<T> {
  /**
   * Number of columns in the board.
   * @property {number} columns
   * @public
   * @readonly
   */
  public readonly columns: number;

  /**
   * Number of rows in the board.
   * @property {number} rows
   * @public
   * @readonly
   */
  public readonly rows: number;

  /**
   * Reactive row-major cell data.
   * @property {SignalValue<readonly (T | null)[]>} cells
   * @public
   * @readonly
   */
  public readonly cells: SignalValue<readonly (T | null)[]>;

  /**
   * Creates an empty board with the requested positive dimensions.
   * @param columns Number of columns.
   * @param rows Number of rows.
   * @public
   * @return {void}
   * @constructor
   */
  public constructor(columns: number, rows: number) {
    this.assertPositiveInteger(columns, 'columns');
    this.assertPositiveInteger(rows, 'rows');
    this.columns = columns;
    this.rows = rows;
    this.cells = signalValue<readonly (T | null)[]>(Array.from({ length: columns * rows }, () => null));
  }

  /**
   * Reads the value at a board coordinate.
   * @param column Zero-based column.
   * @param row Zero-based row.
   * @public
   * @return {T | null}
   */
  public get(column: number, row: number): T | null {
    return this.cells()[this.getIndex(column, row)];
  }

  /**
   * Sets the value at a board coordinate.
   * @param column Zero-based column.
   * @param row Zero-based row.
   * @param value Cell value, or `null` to empty it.
   * @public
   * @return {void}
   */
  public set(column: number, row: number, value: T | null): void {
    const index = this.getIndex(column, row);
    const next = this.cells().slice();
    next[index] = value;
    this.cells.set(next);
  }

  /**
   * Swaps the values in two cells.
   * @param firstColumn First cell column.
   * @param firstRow First cell row.
   * @param secondColumn Second cell column.
   * @param secondRow Second cell row.
   * @public
   * @return {void}
   */
  public swap(firstColumn: number, firstRow: number, secondColumn: number, secondRow: number): void {
    const firstIndex = this.getIndex(firstColumn, firstRow);
    const secondIndex = this.getIndex(secondColumn, secondRow);
    if (firstIndex === secondIndex) return;
    const next = this.cells().slice();
    [next[firstIndex], next[secondIndex]] = [next[secondIndex], next[firstIndex]];
    this.cells.set(next);
  }

  /**
   * Returns valid orthogonal neighbors around a board coordinate.
   * @param column Zero-based column.
   * @param row Zero-based row.
   * @public
   * @return {Array<{ column: number; row: number; value: T | null }>}
   */
  public getNeighbors(column: number, row: number): Array<{
  /**
   * Column index within the grid.
   * @property {number} column
   */
  column: number;
  /**
   * Row index within the grid.
   * @property {number} row
   */
  row: number;
  /**
   * Value to read, validate, format, or assign.
   * @property {T | null} value
   */
  value: T | null }> {
    this.getIndex(column, row);
    return [
      { column: column - 1, row },
      { column: column + 1, row },
      { column, row: row - 1 },
      { column, row: row + 1 }
    ].filter((cell) => this.isInside(cell.column, cell.row))
      .map((cell) => ({ ...cell, value: this.get(cell.column, cell.row) }));
  }

  /**
   * Finds a connected group of matching values from a starting cell.
   * @param column Starting column.
   * @param row Starting row.
   * @param matches Predicate that identifies connected matching cells.
   * @public
   * @return {Array<{ column: number; row: number; value: T }>}
   */
  public floodFill(
    column: number,
    row: number,
    matches: (value: T, origin: T) => boolean
  ): Array<{
  /**
   * Column index within the grid.
   * @property {number} column
   */
  column: number;
  /**
   * Row index within the grid.
   * @property {number} row
   */
  row: number;
  /**
   * Value to read, validate, format, or assign.
   * @property {T} value
   */
  value: T }> {
    const origin = this.get(column, row);
    if (origin === null) return [];
    const visited = new Set<number>();
    const pending = [{ column, row }];
    const result: Array<{
    /**
     * Column index within the grid.
     * @property {number} column
     */
    column: number;
    /**
     * Row index within the grid.
     * @property {number} row
     */
    row: number;
    /**
     * Value to read, validate, format, or assign.
     * @property {T} value
     */
    value: T }> = [];
    while (pending.length > 0) {
      const cell = pending.pop()!;
      const index = this.getIndex(cell.column, cell.row);
      if (visited.has(index)) continue;
      visited.add(index);
      const value = this.cells()[index];
      if (value === null || !matches(value, origin)) continue;
      result.push({ ...cell, value });
      for (const neighbor of this.getNeighbors(cell.column, cell.row)) {
        if (!visited.has(this.getIndex(neighbor.column, neighbor.row))) pending.push(neighbor);
      }
    }
    return result;
  }

  /**
   * Replaces all cells with empty values.
   * @public
   * @return {void}
   */
  public clear(): void {
    this.cells.set(Array.from({ length: this.columns * this.rows }, () => null));
  }

  /**
   * Converts board coordinates to a validated row-major index.
   * @param column Zero-based column.
   * @param row Zero-based row.
   * @private
   * @return {number}
   */
  private getIndex(column: number, row: number): number {
    if (!this.isInside(column, row)) {
      throw new RangeError(`Board coordinate (${column}, ${row}) is outside the grid.`);
    }
    return row * this.columns + column;
  }

  /**
   * Reports whether a cell coordinate belongs to this board.
   * @param column Zero-based column.
   * @param row Zero-based row.
   * @private
   * @return {boolean}
   */
  private isInside(column: number, row: number): boolean {
    return Number.isInteger(column) && Number.isInteger(row)
      && column >= 0 && row >= 0 && column < this.columns && row < this.rows;
  }

  /**
   * Validates a positive board dimension.
   * @param value Dimension value.
   * @param name Dimension name.
   * @private
   * @return {void}
   */
  private assertPositiveInteger(value: number, name: string): void {
    if (!Number.isInteger(value) || value <= 0) throw new RangeError(`${name} must be a positive integer.`);
  }
}
