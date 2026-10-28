/**
 * Defines the reel symbol visual contract shared by its consumers.
 * @interface ReelSymbolVisual
 */
export interface ReelSymbolVisual {
  /**
   * Advances ReelSymbolVisual simulation and dependent presentation state for one frame.
   * @param {number} deltaSeconds Elapsed simulation time in seconds.
   * @param {boolean | undefined} [isWinning] The is winning supplied to this operation.
   * @returns {void}
   */
  update(deltaSeconds: number, isWinning?: boolean): void;
  /**
   * Renders ReelSymbolVisual using its current geometry and presentation state.
   * @param {number} centerX The center x supplied to this operation.
   * @param {number} centerY The center y supplied to this operation.
   * @param {number} width Width of the represented area.
   * @param {number} height Height of the represented area.
   * @param {number | undefined} [blurAmount] The blur amount supplied to this operation.
   * @param {boolean | undefined} [isWinning] The is winning supplied to this operation.
   * @returns {void}
   */
  draw(centerX: number, centerY: number, width: number, height: number, blurAmount?: number, isWinning?: boolean): void;
  /**
   * Updates symbol for ReelSymbolVisual.
   * @param {string} symbol The symbol supplied to this operation.
   * @returns {void}
   */
  setSymbol?(symbol: string): void;
  /**
   * Updates winning for ReelSymbolVisual.
   * @param {boolean} isWinning The is winning supplied to this operation.
   * @returns {void}
   */
  setWinning?(isWinning: boolean): void;
}
