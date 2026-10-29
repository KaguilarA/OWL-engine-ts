import { GridBoard } from '../../engine';

import type { BoardCell, PatternFall } from './interfaces';

/**
 * Shared values used to configure board.
 * @constant
 */
const EMPTY_CELL = -1;

/**
 * Match-three board state and the operations that resolve its matches.
 * @class PatternBoard
 */
export default class {
  /**
   * Stores the cells state.
   * @property {SignalValue<number[][]>} cells
   * @private
   * @readonly
   */
  private readonly grid: GridBoard<number>;
  /**
   * Stores the columns state.
   * @property {number} columns
   * @public
   * @readonly
   */
  public readonly columns: number;
  /**
   * Stores the rows state.
   * @property {number} rows
   * @public
   * @readonly
   */
  public readonly rows: number;
  /**
   * Stores the pattern count state.
   * @property {number} patternCount
   * @private
   * @readonly
   */
  private readonly patternCount: number;

  /**
   * Creates and fills a board without initial horizontal or vertical matches.
   * @public
   * @return {void}
   * @constructor
   * @param {number} columns Number or contents of the grid columns.
   * @param {number} rows The rows supplied to this operation.
   * @param {number} patternCount The pattern count supplied to this operation.
   */
  public constructor(columns: number, rows: number, patternCount: number) {
    this.columns = columns;
    this.rows = rows;
    this.patternCount = patternCount;
    this.grid = new GridBoard(columns, rows);
    this.reset();
  }

  /**
   * Returns the pattern index stored at a cell.
   * @public
   * @return {number}
   * @param {BoardCell} cell The cell supplied to this operation.
   */
  public get(cell: BoardCell): number {
    return this.grid.get(cell.column, cell.row) ?? EMPTY_CELL;
  }

  /**
   * Fills the board with a fresh match-free arrangement.
   * @public
   * @return {void}
   */
  public reset(): void {
    const cells = Array.from(
      { length: this.rows },
      () => Array.from({ length: this.columns }, () => EMPTY_CELL)
    );
    for (let row = 0; row < this.rows; row++) {
      for (let column = 0; column < this.columns; column++) {
        cells[row][column] = this.createPattern(row, column, cells);
      }
    }
    this.setCells(cells);
  }

  /**
   * Swaps adjacent cells only when that swap creates a match.
   * @public
   * @return {BoardCell[] | undefined}
   * @param {BoardCell} first The first supplied to this operation.
   * @param {BoardCell} second The second supplied to this operation.
   */
  public trySwap(first: BoardCell, second: BoardCell): BoardCell[] | undefined {
    if (!this.areAdjacent(first, second)) return undefined;

    const cells = this.getCells();
    this.swap(first, second, cells);
    const matches = this.findMatches(cells);
    if (matches.size === 0) {
      this.swap(first, second, cells);
      return undefined;
    }

    this.setCells(cells);
    return this.toCells(matches);
  }

  /**
   * Returns all cells that currently belong to a run of at least three.
   * @public
   * @return {BoardCell[]}
   */
  public findCurrentMatches(): BoardCell[] {
    return this.toCells(this.findMatches(this.getCells()));
  }

  /**
   * Removes matched cells, compacts each column, fills empty cells, and reports
   * the source and destination rows needed to animate gravity.
   * @param matches - Board coordinates removed by the completed match.
   * @public
   * @return {PatternFall[]} Movements for surviving and newly created patterns.
   */
  public collapse(matches: readonly BoardCell[]): PatternFall[] {
    const cells = this.getCells();
    matches.forEach((cell) => {
      cells[cell.row][cell.column] = EMPTY_CELL;
    });

    const nextCells = Array.from(
      { length: this.rows },
      () => Array.from({ length: this.columns }, () => EMPTY_CELL)
    );
    const falls: PatternFall[] = [];
    for (let column = 0; column < this.columns; column++) {
      const survivors: Array<{
      /**
       * Pattern configuration or state owned by PatternBoard.
       * @property {number} pattern
       */
      pattern: number;
      /**
       * From row configuration or state owned by PatternBoard.
       * @property {number} fromRow
       */
      fromRow: number }> = [];

      for (let row = this.rows - 1; row >= 0; row--) {
        const pattern = cells[row][column];
        if (pattern !== EMPTY_CELL) survivors.push({ pattern, fromRow: row });
      }

      let targetRow = this.rows - 1;
      survivors.forEach(({ pattern, fromRow }) => {
        nextCells[targetRow][column] = pattern;
        if (fromRow !== targetRow) {
          falls.push({ column, pattern, fromRow, toRow: targetRow });
        }
        targetRow -= 1;
      });

      let spawnOffset = 1;
      for (let row = targetRow; row >= 0; row--) {
        const pattern = Math.floor(Math.random() * this.patternCount);
        nextCells[row][column] = pattern;
        falls.push({
          column,
          pattern,
          fromRow: -spawnOffset,
          toRow: row
        });
        spawnOffset += 1;
      }
    }

    this.setCells(nextCells);
    return falls;
  }

  /**
   * Picks a pattern that does not create a match during initial filling.
   * @param row - Row being filled.
   * @param column - Column being filled.
   * @param cells - Partial board used to reject immediate matches.
   * @private
   * @return {number}
   */
  private createPattern(row: number, column: number, cells: number[][]): number {
    const options = Array.from(
      { length: this.patternCount },
      (_, pattern) => pattern
    ).filter((pattern) => (
      !this.createsInitialMatch(row, column, pattern, cells)
    ));

    return options[Math.floor(Math.random() * options.length)];
  }

  /**
   * Checks whether a candidate completes a horizontal or vertical run.
   * @param row - Row being evaluated.
   * @param column - Column being evaluated.
   * @param pattern - Candidate pattern index.
   * @param cells - Partial board used for neighboring pattern comparisons.
   * @private
   * @return {boolean} Whether the candidate would make a match.
   */
  private createsInitialMatch(
    row: number,
    column: number,
    pattern: number,
    cells: number[][]
  ): boolean {
    return (
      (
        column >= 2
        && cells[row][column - 1] === pattern
        && cells[row][column - 2] === pattern
      )
      || (
        row >= 2
        && cells[row - 1][column] === pattern
        && cells[row - 2][column] === pattern
      )
    );
  }

  /**
   * Reports whether two cells share an edge.
   * @private
   * @return {boolean}
   * @param {BoardCell} first The first supplied to this operation.
   * @param {BoardCell} second The second supplied to this operation.
   */
  private areAdjacent(first: BoardCell, second: BoardCell): boolean {
    const columnDistance = Math.abs(first.column - second.column);
    const rowDistance = Math.abs(first.row - second.row);

    return columnDistance + rowDistance === 1;
  }

  /**
   * Exchanges the pattern indices in two cells in the supplied board copy.
   * @param first - Coordinate of the first pattern.
   * @param second - Coordinate of the second pattern.
   * @param cells - Board copy whose pattern values are exchanged.
   * @private
   * @return {void}
   */
  private swap(first: BoardCell, second: BoardCell, cells: number[][]): void {
    const pattern = cells[first.row][first.column];
    cells[first.row][first.column] = cells[second.row][second.column];
    cells[second.row][second.column] = pattern;
  }

  /**
   * Collects horizontal and vertical matches as unique cell keys.
   * @param cells - Board grid inspected for matching runs.
   * @private
   * @return {Set<string>}
   */
  private findMatches(cells: number[][]): Set<string> {
    const matches = new Set<string>();

    for (let row = 0; row < this.rows; row++) {
      this.findRowMatches(row, matches, cells);
    }

    for (let column = 0; column < this.columns; column++) {
      this.findColumnMatches(column, matches, cells);
    }

    return matches;
  }

  /**
   * Adds every horizontal run of at least three patterns to the result.
   * @param row - Row inspected for horizontal runs.
   * @param matches - Mutable set receiving matched cell keys.
   * @param cells - Board grid inspected for matches.
   * @private
   * @return {void}
   */
  private findRowMatches(row: number, matches: Set<string>, cells: number[][]): void {
    let start = 0;

    while (start < this.columns) {
      const pattern = cells[row][start];
      let end = start + 1;

      while (end < this.columns && cells[row][end] === pattern) {
        end += 1;
      }

      if (pattern !== EMPTY_CELL && end - start >= 3) {
        for (let column = start; column < end; column++) {
          matches.add(this.cellKey({ column, row }));
        }
      }

      start = end;
    }
  }

  /**
   * Adds every vertical run of at least three patterns to the result.
   * @param column - Column inspected for vertical runs.
   * @param matches - Mutable set receiving matched cell keys.
   * @param cells - Board grid inspected for matches.
   * @private
   * @return {void}
   */
  private findColumnMatches(column: number, matches: Set<string>, cells: number[][]): void {
    let start = 0;

    while (start < this.rows) {
      const pattern = cells[start][column];
      let end = start + 1;

      while (end < this.rows && cells[end][column] === pattern) {
        end += 1;
      }

      if (pattern !== EMPTY_CELL && end - start >= 3) {
        for (let row = start; row < end; row++) {
          matches.add(this.cellKey({ column, row }));
        }
      }

      start = end;
    }
  }

  /**
   * Encodes a grid coordinate for set-based match collection.
   * @private
   * @return {string}
   * @param {BoardCell} cell The cell supplied to this operation.
   */
  private cellKey(cell: BoardCell): string {
    return `${cell.column},${cell.row}`;
  }

  /**
   * Decodes a coordinate key created by {@link cellKey}.
   * @private
   * @return {BoardCell}
   * @param {string} key Key identifying the associated input or resource.
   */
  private parseCellKey(key: string): BoardCell {
    const [column, row] = key.split(',').map(Number);

    return { column, row };
  }

  /**
   * Converts collected coordinate keys back into grid cells.
   * @private
   * @return {BoardCell[]}
   * @param {Set<string>} matches The matches supplied to this operation.
   */
  private toCells(matches: Set<string>): BoardCell[] {
    return [...matches].map((key) => this.parseCellKey(key));
  }

  /**
   * Copies reactive grid cells into the matrix used by match resolution.
   * @private
   * @return {number[][]}
   */
  private getCells(): number[][] {
    return Array.from({ length: this.rows }, (_, row) => (
      Array.from({ length: this.columns }, (_, column) => this.get({ row, column }))
    ));
  }

  /**
   * Replaces the reactive grid contents from a row-based board matrix.
   * @param cells Matrix containing each row's pattern indices.
   * @private
   * @return {void}
   */
  private setCells(cells: number[][]): void {
    this.grid.cells.set(cells.flat());
  }
}
