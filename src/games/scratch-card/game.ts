import { signalValue } from 'reactive-values';
import {
  BaseGame,
  GameBackground,
  GameContext,
  GameEvents,
  GameLoader,
  WeightedTable,
  type GamePointer
} from '../../engine';

import { ScratchIcon, ScratchSurface } from './';

/**
 * Shared values used to configure game.
 * @constant
 */
const SYMBOLS = [
  'beetlemorph', 'rhinomorph', 'lobstermorph',
  'eaglemorph', 'phantommorph', 'squidmorph'
] as const;
/**
 * Shared values used to configure game.
 * @constant
 */
const PRIZES = [20, 50, 100, 250, 500, 1000] as const;
/**
 * Shared values used to configure game.
 * @constant
 */
const WIN_ANIMATION_DURATION = 2;

/**
 * Coordinates scratch-card rules and rendering through the shared game lifecycle.
 * @class ScratchCardGame
 */
export default class extends BaseGame {
  /**
   * Selects whether a newly generated card contains a winning match.
   * @property {WeightedTable<boolean>} winOutcome
   * @private
   * @readonly
   */
  private readonly winOutcome = new WeightedTable([
    { value: true, weight: 35 },
    { value: false, weight: 65 }
  ] as const);
  /**
   * Reactive icons state owned by ScratchCardGame.
   * @property {SignalValue<readonly ScratchIcon[]> & (() => readonly ScratchIcon[])} icons
   * @readonly
   * @private
   */
  private readonly icons = signalValue<readonly ScratchIcon[]>([]);
  /**
   * Scratch surface configuration or state owned by ScratchCardGame.
   * @property {ScratchSurface} scratchSurface
   * @readonly
   * @private
   */
  private readonly scratchSurface = new ScratchSurface(() => this.getCardBounds());
  /**
   * Revealed configuration or state owned by ScratchCardGame.
   * @property {SignalValue<boolean>} revealed
   * @readonly
   * @private
   */
  private readonly revealed = this.scratchSurface.revealed;
  /**
   * Reactive win animation elapsed state owned by ScratchCardGame.
   * @property {SignalValue<number> & (() => number)} winAnimationElapsed
   * @readonly
   * @private
   */
  private readonly winAnimationElapsed = signalValue(0);
  /**
   * Reactive win animation started state owned by ScratchCardGame.
   * @property {SignalValue<boolean> & (() => boolean)} winAnimationStarted
   * @readonly
   * @private
   */
  private readonly winAnimationStarted = signalValue(false);
  /**
   * Remove pointer listeners configuration or state owned by ScratchCardGame.
   * @property {(() => void)[]} removePointerListeners
   * @readonly
   * @private
   */
  private readonly removePointerListeners: Array<() => void>;

  /**
   * Initializes ScratchCardGame and its owned resources from the supplied arguments.
   * @constructor
   * @param {(() => void) | undefined} [onReturnToMenu] Callback invoked when this game returns to the selector.
   * @returns {void}
   * @public
   */
  public constructor(onReturnToMenu?: () => void) {
    super(onReturnToMenu, { showResetButton: false });
    this.removePointerListeners = [
      GameEvents.addPointerDownListener(this.handlePointerDown),
      GameEvents.addPointerMoveListener(this.handlePointerMove),
      GameEvents.addPointerEndListener(this.handlePointerEnd)
    ];
    this.registerCleanup(() => this.removePointerListeners.forEach((remove) => remove()));
    this.resetCard();
    this.start();
  }

  /**
   * Returns is game over from the current ScratchCardGame state.
   * @returns {boolean} is game over from the current ScratchCardGame state.
   * @protected
   */
  protected get isGameOver(): boolean {
    return this.revealed() && (!this.hasWinningMatch() || this.winAnimationElapsed() >= WIN_ANIMATION_DURATION);
  }

  /**
   * Advances game-specific simulation for one active frame.
   * @param {number} deltaSeconds Elapsed simulation time in seconds.
   * @returns {void}
   * @protected
   */
  protected updateGame(deltaSeconds: number): void {
    this.scratchSurface.update(deltaSeconds);
    if (!this.revealed() || !this.hasWinningMatch()) return;
    if (!this.winAnimationStarted()) {
      this.winAnimationStarted.set(true);
      this.icons().forEach((icon) => icon.setWinning(true));
    }
    this.icons().forEach((icon) => icon.update(deltaSeconds));
    this.winAnimationElapsed.set(this.winAnimationElapsed() + deltaSeconds);
  }

  /**
   * Renders the game scene and its current HUD before shared engine controls.
   * @returns {void}
   * @protected
   */
  protected drawGame(): void {
    const bounds = this.getCardBounds();
    const { x, y, width, height } = bounds;
    const viewport = GameContext.gameDimensionsModel;
    GameContext.clear();
    GameBackground.draw(
      GameLoader.getImage('background1080x1920'),
      GameLoader.getImage('background1920x1080'),
      'rgba(13, 10, 29, 0.56)'
    );

    this.drawText('LUCKY SCRATCH', viewport.getWidth() * 0.5, y - 36, 25, '#ffe27a');
    GameContext.drawRect(x, y, width, height, '#e8c35e');
    GameContext.drawRect(x + 5, y + 5, width - 10, height - 10, '#173d4a');
    this.drawText('MATCH 3 SYMBOLS TO WIN', viewport.getWidth() * 0.5, y + 34, 14, '#c9f4e8');

    const cellWidth = (width - 48) / 3;
    this.icons().forEach((icon, index) => {
      const cellX = x + 16 + index * (cellWidth + 8);
      const cellY = y + 66;
      const cellHeight = height - 118;
      GameContext.drawRect(cellX, cellY, cellWidth, cellHeight, '#0d2735');
      icon.draw(cellX + cellWidth / 2, cellY + cellHeight / 2, Math.min(cellWidth * 0.7, cellHeight * 0.65));
    });

    this.scratchSurface.draw(bounds);
    if (this.revealed()) {
      const winning = this.hasWinningMatch();
      const prize = winning ? PRIZES[SYMBOLS.indexOf(this.icons()[0].symbol as typeof SYMBOLS[number])] : 0;
      this.drawText(winning ? `YOU WIN  $${prize}!` : 'NO MATCH — TRY AGAIN',
        viewport.getWidth() * 0.5, y + height + 42, 23, winning ? '#ffe27a' : '#ffffff');
    } else {
      this.drawText('RUB THE CARD TO REVEAL', viewport.getWidth() * 0.5,
        y + height + 42, 15, '#c9f4e8');
    }
  }

  /**
   * Restores game-specific state for a new run.
   * @returns {void}
   * @protected
   */
  protected restartGame(): void {
    this.resetCard();
  }

  /**
   * Recalculates game-specific layout after the viewport dimensions change.
   * @returns {void}
   * @protected
   */
  protected onViewportChanged(): void {
    this.scratchSurface.resize();
  }

  /**
   * Callback handling pointer down for ScratchCardGame.
   * @property {(pointer: GamePointer) => void} handlePointerDown
   * @readonly
   * @private
   */
  private readonly handlePointerDown = (pointer: GamePointer): void => {
    if (this.controls.isPaused || this.revealed()) return;
    this.scratchSurface.begin(pointer);
  };

  /**
   * Callback handling pointer move for ScratchCardGame.
   * @property {(pointer: GamePointer) => void} handlePointerMove
   * @readonly
   * @private
   */
  private readonly handlePointerMove = (pointer: GamePointer): void => {
    if (this.controls.isPaused || this.revealed()) {
      this.scratchSurface.cancel();
      return;
    }
    this.scratchSurface.move(pointer);
  };

  /**
   * Callback handling pointer end for ScratchCardGame.
   * @property {(_pointer: GamePointer) => void} handlePointerEnd
   * @readonly
   * @private
   */
  private readonly handlePointerEnd = (_pointer: GamePointer): void => {
    this.scratchSurface.end();
  };

  /**
   * Resets card for ScratchCardGame.
   * @returns {void}
   * @private
   */
  private resetCard(): void {
    const symbols = this.createCardSymbols();
    this.icons.set(symbols.map((symbol) => new ScratchIcon(symbol)));
    this.winAnimationElapsed.set(0);
    this.winAnimationStarted.set(false);
    this.scratchSurface.reset();
  }

  /**
   * Constructs card symbols for ScratchCardGame.
   * @returns {readonly string[]} Constructs card symbols for ScratchCardGame.
   * @private
   */
  private createCardSymbols(): readonly string[] {
    const first = SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];
    if (this.winOutcome.draw()) return [first, first, first];
    return [
      first,
      SYMBOLS[(SYMBOLS.indexOf(first) + 1) % SYMBOLS.length],
      SYMBOLS[(SYMBOLS.indexOf(first) + 2) % SYMBOLS.length]
    ];
  }

  /**
   * Reports whether the revealed card contains a qualifying symbol match.
   * @returns {boolean} the revealed card contains a qualifying symbol match.
   * @private
   */
  private hasWinningMatch(): boolean {
    const [first, second, third] = this.icons();
    return first !== undefined && first.symbol === second?.symbol && second.symbol === third?.symbol;
  }

  /**
   * Returns card bounds for ScratchCardGame.
   * @returns {{ x: number; y: number; width: number; height: number }} card bounds for ScratchCardGame.
   * @private
   */
  private getCardBounds(): {
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
    const dimensions = GameContext.gameDimensionsModel;
    const width = Math.min(dimensions.getWidth() * 0.88, 480);
    const height = Math.max(250, Math.min(dimensions.getHeight() * 0.48, 330));
    return {
      x: (dimensions.getWidth() - width) / 2,
      y: (dimensions.getHeight() - height) / 2,
      width,
      height
    };
  }

  /**
   * Renders text for ScratchCardGame.
   * @param {string} text Text to parse, display, or assign.
   * @param {number} x Horizontal coordinate in the owning coordinate space.
   * @param {number} y Vertical coordinate in the owning coordinate space.
   * @param {number} size The size supplied to this operation.
   * @param {string} color Color applied when rendering this content.
   * @returns {void}
   * @private
   */
  private drawText(text: string, x: number, y: number, size: number, color: string): void {
    GameContext.drawText(text, x, y, size, color, 'center', GameContext.gameDimensionsModel.getWidth() * 0.9);
  }
}
