import {
  GameBackground,
  GameContext,
  type Button
} from '../../engine';

import { type MusketeersSlotAssets, type MusketeersSlotRound, MUSKETEERS_REEL_COUNT, PAYLINE_COUNT } from './';

/**
 * Defines the label drawer contract shared by its consumers.
 * @typedef {LabelDrawer} LabelDrawer
 */
type LabelDrawer = (
  text: string, x: number, y: number, fontSize: number, color: string,
  align?: CanvasTextAlign, maxWidth?: number
) => void;

/**
 * Draws the slot presentation without owning its round state or loading assets.
 * @class MusketeersSlotRenderer
 */
export default class {
  /**
   * Assets configuration or state owned by MusketeersSlotRenderer.
   * @property {MusketeersSlotAssets} assets
   * @readonly
   * @private
   */
  private readonly assets: MusketeersSlotAssets;
  /**
   * Round configuration or state owned by MusketeersSlotRenderer.
   * @property {MusketeersSlotRound} round
   * @readonly
   * @private
   */
  private readonly round: MusketeersSlotRound;
  /**
   * Spin button configuration or state owned by MusketeersSlotRenderer.
   * @property {Button} spinButton
   * @readonly
   * @private
   */
  private readonly spinButton: Button;
  /**
   * Decrease bet button configuration or state owned by MusketeersSlotRenderer.
   * @property {Button} decreaseBetButton
   * @readonly
   * @private
   */
  private readonly decreaseBetButton: Button;
  /**
   * Increase bet button configuration or state owned by MusketeersSlotRenderer.
   * @property {Button} increaseBetButton
   * @readonly
   * @private
   */
  private readonly increaseBetButton: Button;
  /**
   * Label drawer configuration or state owned by MusketeersSlotRenderer.
   * @property {LabelDrawer} labelDrawer
   * @readonly
   * @private
   */
  private readonly labelDrawer: LabelDrawer;

  /**
   * Initializes MusketeersSlotRenderer and its owned resources from the supplied arguments.
   * @constructor
   * @param {MusketeersSlotAssets} assets The assets supplied to this operation.
   * @param {MusketeersSlotRound} round The round supplied to this operation.
   * @param {Button} spinButton The spin button supplied to this operation.
   * @param {Button} decreaseBetButton The decrease bet button supplied to this operation.
   * @param {Button} increaseBetButton The increase bet button supplied to this operation.
   * @param {LabelDrawer} labelDrawer The label drawer supplied to this operation.
   * @returns {void}
   * @public
   */
  public constructor(
    assets: MusketeersSlotAssets,
    round: MusketeersSlotRound,
    spinButton: Button,
    decreaseBetButton: Button,
    increaseBetButton: Button,
    labelDrawer: LabelDrawer
  ) {
    this.assets = assets;
    this.round = round;
    this.spinButton = spinButton;
    this.decreaseBetButton = decreaseBetButton;
    this.increaseBetButton = increaseBetButton;
    this.labelDrawer = labelDrawer;
  }

  /**
   * Renders MusketeersSlotRenderer using its current geometry and presentation state.
   * @returns {void}
   * @public
   */
  public draw(): void {
    const width = GameContext.gameDimensionsModel.getWidth();
    const height = GameContext.gameDimensionsModel.getHeight();
    GameContext.clear();
    const isFreeSpinMode = this.round.freeSpins() > 0;
    GameBackground.draw(
      isFreeSpinMode ? this.assets.backgrounds.portrait.freeSpins : this.assets.backgrounds.portrait.normal,
      isFreeSpinMode ? this.assets.backgrounds.landscape.freeSpins : this.assets.backgrounds.landscape.normal
    );
    const board = this.getBoardBounds(width, height);
    GameContext.drawImage(isFreeSpinMode ? this.assets.reelFrames.freeSpins : this.assets.reelFrames.normal,
      board.x, board.y, board.width, board.height);
    this.drawReels(board.x, board.y, board.width, board.height);
    this.drawHud(width, height, board);
  }

  /**
   * Renders label for MusketeersSlotRenderer.
   * @param {string} text Text to parse, display, or assign.
   * @param {number} x Horizontal coordinate in the owning coordinate space.
   * @param {number} y Vertical coordinate in the owning coordinate space.
   * @param {number} fontSize Font size used to render the label.
   * @param {string} color Color applied when rendering this content.
   * @param {CanvasTextAlign} [align] The align supplied to this operation.
   * @param {number | undefined} [maxWidth] The max width supplied to this operation.
   * @returns {void}
   * @private
   */
  private drawLabel(
    text: string, x: number, y: number, fontSize: number, color: string,
    align: CanvasTextAlign = 'left', maxWidth?: number
  ): void {
    this.labelDrawer(text, x, y, fontSize, color, align, maxWidth);
  }
  /**
   * Returns board bounds for MusketeersSlotRenderer.
   * @param {number} width Width of the represented area.
   * @param {number} height Height of the represented area.
   * @returns {{ x: number; y: number; width: number; height: number }} board bounds for MusketeersSlotRenderer.
   * @private
   */
  private getBoardBounds(width: number, height: number): {
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
  height: number } {
    const aspectRatio = 1126 / 689;
    if (this.isPortraitLayout(width, height)) {
      const maxBoardHeight = Math.max(80, Math.min(height * 0.56, height * 0.705 - width * 0.2));
      const boardWidth = Math.min(width * 0.94, maxBoardHeight * aspectRatio);
      const boardHeight = boardWidth / aspectRatio;
      return {
        x: (width - boardWidth) * 0.5,
        y: Math.max(32, height * 0.075),
        width: boardWidth,
        height: boardHeight
      };
    }
    const boardWidth = Math.min(width * 0.68, height * 0.83 * aspectRatio);
    const boardHeight = boardWidth / aspectRatio;
    return {
      x: (width - boardWidth) * 0.5,
      y: Math.max(20, height * 0.035),
      width: boardWidth,
      height: boardHeight
    };
  }

  /**
   * Renders reels for MusketeersSlotRenderer.
   * @param {number} x Horizontal coordinate in the owning coordinate space.
   * @param {number} y Vertical coordinate in the owning coordinate space.
   * @param {number} width Width of the represented area.
   * @param {number} height Height of the represented area.
   * @returns {void}
   * @private
   */
  private drawReels(x: number, y: number, width: number, height: number): void {
    const round = this.round;
    if (!round) return;
    const insetX = width * 0.035;
    const insetY = height * 0.045;
    const gridX = x + insetX;
    const gridY = y + insetY;
    const gridWidth = width - insetX * 2;
    const gridHeight = height - insetY * 2;
    const cellWidth = gridWidth / MUSKETEERS_REEL_COUNT;
    const cellHeight = gridHeight / 3;
    const iconSize = Math.min(cellWidth, cellHeight) * 0.94;
    round.reelBank.reels.forEach((reel, reelIndex) => {
      const centerX = gridX + cellWidth * (reelIndex + 0.5);
      reel.dimensions.setPosition(centerX - cellWidth * 0.5, gridY);
      reel.dimensions.setSize(cellWidth, gridHeight);
      reel.dimensions.setPivot(0, 0);
      const visibleIcons = reel.getVisibleSymbols().map((visible, index) => {
        const icon = round.reelBank.icons[reelIndex][index];
        const winning = round.winningCells().has(`${reelIndex}:${visible.row}`);
        icon.setPresentation(this.assets?.symbols.get(visible.symbol), visible.blurAmount, winning);
        icon.dimensions.setPosition(cellWidth * 0.5, cellHeight * visible.offsetCells);
        icon.dimensions.setSize(iconSize, iconSize);
        return icon;
      });
      reel.setChildren(visibleIcons);
      reel.draw();
    });
  }

  /**
   * Renders hud for MusketeersSlotRenderer.
   * @param {number} width Width of the represented area.
   * @param {number} height Height of the represented area.
   * @param {{ x: number; y: number; width: number; height: number; }} board The board supplied to this operation.
   * @returns {void}
   * @private
   */
  private drawHud(
    width: number,
    height: number,
    board: {
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
    height: number }
  ): void {
    const round = this.round;
    if (!round) return;
    const portrait = this.isPortraitLayout(width, height);
    const unit = GameContext.viewportUnit();
    const barWidth = portrait ? width : Math.min(width * 0.66, 1320);
    const barX = (width - barWidth) * 0.5;
    const barHeight = portrait
      ? Math.max(70, Math.min(height * 0.085, 108))
      : Math.max(70, Math.min(height * 0.095, 112));
    const footerHeight = Math.max(24, Math.min(height * 0.036, 38));
    const barY = height - barHeight - footerHeight;
    this.drawBottomBar(barX, barY, barWidth, barHeight, footerHeight, portrait, unit);

    const buttonX = portrait ? width * 0.5 : width * 0.92;
    const desiredButtonY = height * 0.74;
    const availableButtonSize = barY - board.y - board.height - height * 0.04;
    const buttonSize = portrait
      ? Math.max(56, Math.min(unit * 0.205, 154, Math.max(56, availableButtonSize)))
      : Math.max(48, Math.min(height * 0.2, width * 0.14, 190));
    const buttonY = portrait
      ? Math.min(Math.max(desiredButtonY, board.y + board.height + buttonSize * 0.5 + height * 0.025), barY - buttonSize * 0.5 - 8)
      : barY;
    this.spinButton.dimensions.setPosition(buttonX, buttonY);
    this.spinButton.dimensions.setSize(buttonSize, buttonSize);
    this.spinButton.dimensions.setPivot(0.5, 0.5);
    const spin = this.assets?.spinButtonAtlas.getRegion('normal');
    const spinArrow = this.assets?.spinButtonAtlas.getRegion('spin');
    const spinButtonImage = this.assets?.spinButtonImage;
    if (spinButtonImage && spin) {
      GameContext.context.drawImage(spinButtonImage, spin.x, spin.y, spin.width, spin.height, buttonX - buttonSize / 2, buttonY - buttonSize / 2, buttonSize, buttonSize);
      if (spinArrow) GameContext.context.drawImage(spinButtonImage, spinArrow.x, spinArrow.y, spinArrow.width, spinArrow.height, buttonX - buttonSize * 0.35, buttonY - buttonSize * 0.35, buttonSize * 0.7, buttonSize * 0.7);
    } else {
      GameContext.drawCircle(buttonX, buttonY, buttonSize / 2, '#ec9b16');
      this.drawLabel('↻', buttonX, buttonY + buttonSize * 0.22, buttonSize * 0.65, '#fff6d5', 'center');
    }
    const betPanelWidth = barWidth * (portrait ? 0.48 : 0.39);
    const betPanelX = barX + betPanelWidth * 0.5;
    const betY = barY + barHeight * 0.58;
    const betButtonRadius = Math.max(14, Math.min(barHeight * 0.27, 26));
    const betButtonSize = betButtonRadius * 2.4;
    const decreaseX = betPanelX - betPanelWidth * 0.39;
    const increaseX = betPanelX + betPanelWidth * 0.39;
    this.decreaseBetButton.dimensions.setPosition(decreaseX, betY);
    this.decreaseBetButton.dimensions.setSize(betButtonSize, betButtonSize);
    this.decreaseBetButton.dimensions.setPivot(0.5, 0.5);
    this.increaseBetButton.dimensions.setPosition(increaseX, betY);
    this.increaseBetButton.dimensions.setSize(betButtonSize, betButtonSize);
    this.increaseBetButton.dimensions.setPivot(0.5, 0.5);
    const betTextSize = Math.max(16, Math.min(unit * 0.035, 26, betButtonRadius * 1.2));
    this.drawButton(decreaseX, betY, betButtonRadius, '−', betTextSize, '#72221b');
    this.drawButton(increaseX, betY, betButtonRadius, '+', betTextSize, '#72221b');
  }

  /**
   * Renders bottom bar for MusketeersSlotRenderer.
   * @param {number} x Horizontal coordinate in the owning coordinate space.
   * @param {number} y Vertical coordinate in the owning coordinate space.
   * @param {number} width Width of the represented area.
   * @param {number} height Height of the represented area.
   * @param {number} footerHeight The footer height supplied to this operation.
   * @param {boolean} portrait The portrait supplied to this operation.
   * @param {number} unit The unit supplied to this operation.
   * @returns {void}
   * @private
   */
  private drawBottomBar(
    x: number,
    y: number,
    width: number,
    height: number,
    footerHeight: number,
    portrait: boolean,
    unit: number
  ): void {
    const round = this.round;
    if (!round) return;
    const context = GameContext.context;
    const betWidth = width * (portrait ? 0.5 : 0.33);
    const creditWidth = width * (portrait ? 0.34 : 0.2);
    const middleWidth = width - betWidth - creditWidth;
    const betGradient = context.createLinearGradient(x, y, x, y + height);
    betGradient.addColorStop(0, '#ff3c31');
    betGradient.addColorStop(0.12, '#bd0916');
    betGradient.addColorStop(1, '#4b0017');
    context.fillStyle = betGradient;
    context.fillRect(x, y, betWidth, height);
    context.strokeStyle = '#ffb54a';
    context.lineWidth = 2;
    context.strokeRect(x + 2, y + 2, betWidth - 4, height - 4);

    const creditX = x + betWidth;
    const middleGradient = context.createLinearGradient(creditX, y, creditX, y + height);
    middleGradient.addColorStop(0, '#06264a');
    middleGradient.addColorStop(1, '#07162b');
    context.fillStyle = middleGradient;
    context.fillRect(creditX, y, middleWidth, height);
    const creditsX = creditX + middleWidth;
    const creditsGradient = context.createLinearGradient(creditsX, y, creditsX, y + height);
    creditsGradient.addColorStop(0, '#16416a');
    creditsGradient.addColorStop(1, '#0b2848');
    context.fillStyle = creditsGradient;
    context.fillRect(creditsX, y, creditWidth, height);
    context.strokeStyle = 'rgba(255, 224, 153, 0.55)';
    context.lineWidth = 2;
    context.strokeRect(x + 1, y + 1, width - 2, height - 2);

    const labelSize = Math.max(11, Math.min(unit * 0.026, portrait ? 17 : 22));
    const valueSize = Math.max(18, Math.min(
      unit * (portrait ? 0.052 : 0.06),
      portrait ? 36 : 56,
      height * 0.48
    ));
    const inset = Math.max(12, width * 0.018);
    this.drawLabel('TOTAL BET', x + inset, y + height * 0.34, labelSize, '#ffe05b', 'left', betWidth * 0.72);
    this.drawLabel(`$${round.bet().toFixed(2)}`, x + betWidth * 0.58, y + height * 0.76,
      valueSize, '#ffd625', 'center', betWidth * 0.46);
    this.drawLabel('CREDITS', creditsX + creditWidth * 0.5, y + height * 0.34,
      labelSize * 0.84, '#9bb8d7', 'center', creditWidth - inset);
    this.drawLabel(`${round.balance().toFixed(2)}`, creditsX + creditWidth * 0.5, y + height * 0.74,
      labelSize * 1.15, '#edf5ff', 'center', creditWidth - inset);
    const sideMessage = round.freeSpins() > 0
      ? `FREE SPINS  ${round.freeSpins()}`
      : round.win() > 0
        ? `WIN  ${round.win().toFixed(2)}`
        : round.spinning() ? 'SPINNING' : 'READY';
    if (round.freeSpins() > 0 || round.win() > 0) {
      this.drawLabel(sideMessage, creditX + middleWidth * 0.42, y + height * 0.74,
        Math.max(9, labelSize * 0.85), '#fff0a0', 'center', middleWidth * 0.68);
    }
    const footerY = y + height;
    const canvasWidth = GameContext.gameDimensionsModel.getWidth();
    const footerSize = Math.max(10, Math.min(unit * 0.022, 15));
    const footerTextHeight = footerSize * 1.4;
    const footerContainerY = footerY;
    context.fillStyle = '#702207';
    context.fillRect(0, footerContainerY, canvasWidth, footerHeight);
    context.strokeStyle = '#ffbd3f';
    context.lineWidth = 2;
    context.strokeRect(1, footerContainerY + 1, canvasWidth - 2, footerHeight - 2);
    const leftText = 'COIN VALUE 5¢';
    const rightText = `LINES ${PAYLINE_COUNT}`;
    const footerTextBaseline = footerContainerY + (footerHeight + footerTextHeight) * 0.5;
    this.drawLabel(leftText, canvasWidth * 0.22,
      footerTextBaseline, footerSize, '#ffe8bb', 'center', width * 0.42);
    this.drawLabel(rightText, canvasWidth * 0.78,
      footerTextBaseline, footerSize, '#ffe8bb', 'center', width * 0.42);
  }

  /**
   * Renders button for MusketeersSlotRenderer.
   * @param {number} x Horizontal coordinate in the owning coordinate space.
   * @param {number} y Vertical coordinate in the owning coordinate space.
   * @param {number} radius Radius of the circular shape.
   * @param {string} label The label supplied to this operation.
   * @param {number} size The size supplied to this operation.
   * @param {string} color Color applied when rendering this content.
   * @returns {void}
   * @private
   */
  private drawButton(x: number, y: number, radius: number, label: string, size: number, color: string): void {
    GameContext.drawCircle(x, y, radius, 'rgba(30,12,7,0.75)');
    GameContext.drawCircle(x, y - 2, radius * 0.85, color);
    this.drawLabel(label, x, y + size * 0.28, size * 1.25, '#fff4d1', 'center');
  }

  /**
   * Checks whether the object satisfies portrait layout for MusketeersSlotRenderer.
   * @param {number} width Width of the represented area.
   * @param {number} height Height of the represented area.
   * @returns {boolean} the object satisfies portrait layout for MusketeersSlotRenderer.
   * @private
   */
  private isPortraitLayout(width: number, height: number): boolean {
    return height > width;
  }

}
