import {
  BaseGame,
  Button,
  GameInput,
  Texture
} from '../../engine';

import { MusketeersSlotAssets, MusketeersSlotRound, MusketeersSlotRenderer } from './';

/**
 * Five-reel Musketeers slot game, rendered with the engine's Canvas sprites.
 * @class MusketeersSlotGame
 */
export default class extends BaseGame {
  /**
   * Spin button configuration or state owned by MusketeersSlotGame.
   * @property {Button} spinButton
   * @readonly
   * @private
   */
  private readonly spinButton: Button;
  /**
   * Decrease bet button configuration or state owned by MusketeersSlotGame.
   * @property {Button} decreaseBetButton
   * @readonly
   * @private
   */
  private readonly decreaseBetButton = new Button(new Texture({}, 0, 0), {
    onClick: () => {
      const round = this.round;
      if (round) round.bet.set(Math.max(1, round.bet() - 1));
    }
  });
  /**
   * Increase bet button configuration or state owned by MusketeersSlotGame.
   * @property {Button} increaseBetButton
   * @readonly
   * @private
   */
  private readonly increaseBetButton = new Button(new Texture({}, 0, 0), {
    onClick: () => {
      const round = this.round;
      if (round) round.bet.set(Math.min(100, round.bet() + 1));
    }
  });
  /**
   * Assets configuration or state owned by MusketeersSlotGame.
   * @property {MusketeersSlotAssets | undefined} assets
   * @private
   */
  private assets: MusketeersSlotAssets | undefined;
  /**
   * Round configuration or state owned by MusketeersSlotGame.
   * @property {MusketeersSlotRound | undefined} round
   * @private
   */
  private round: MusketeersSlotRound | undefined;
  /**
   * Renderer configuration or state owned by MusketeersSlotGame.
   * @property {MusketeersSlotRenderer | undefined} renderer
   * @private
   */
  private renderer: MusketeersSlotRenderer | undefined;

  /**
   * Initializes MusketeersSlotGame and its owned resources from the supplied arguments.
   * @constructor
   * @param {(() => void) | undefined} [onReturnToMenu] Callback invoked when this game returns to the selector.
   * @returns {void}
   * @public
   */
  public constructor(onReturnToMenu?: () => void) {
    super(onReturnToMenu, { showResetButton: false, menuAlignment: 'left' });
    this.spinButton = new Button(new Texture({}, 0, 0), { onClick: () => this.round?.spin() });
    [this.spinButton, this.decreaseBetButton, this.increaseBetButton].forEach((button) => {
      this.registerCleanup(() => button.destroy());
    });
    this.registerCleanup(() => {
      this.assets?.dispose();
    });
    void MusketeersSlotAssets.load().then((assets) => {
      this.assets = assets;
      this.round = new MusketeersSlotRound(assets);
      this.renderer = new MusketeersSlotRenderer(
        assets,
        this.round,
        this.spinButton,
        this.decreaseBetButton,
        this.increaseBetButton,
        (text, x, y, size, color, align, maxWidth) => this.drawLabel(text, x, y, size, color, align, maxWidth)
      );
      this.start();
    }).catch((error: unknown) => {
      console.error('Unable to load the Musketeers slot assets.', error);
    });
  }

  /**
   * Advances game-specific simulation for one active frame.
   * @param {number} deltaSeconds Elapsed simulation time in seconds.
   * @returns {void}
   * @protected
   */
  protected updateGame(deltaSeconds: number): void {
    const round = this.round;
    if (!round) return;
    this.spinButton.setBlocked(false);
    this.spinButton.setDisabled(!round.spinning()
      && round.balance() < round.bet() && round.freeSpins() === 0);
    this.decreaseBetButton.setBlocked(round.spinning());
    this.increaseBetButton.setBlocked(round.spinning());
    if (GameInput.wasPressed('spin')) round.spin();
    round.update(deltaSeconds);
  }

  /**
   * Renders the game scene and its current HUD before shared engine controls.
   * @returns {void}
   * @protected
   */
  protected drawGame(): void {
    this.renderer?.draw();
  }

  /**
   * Restores game-specific state for a new run.
   * @returns {void}
   * @protected
   */
  protected restartGame(): void {
    this.round?.restart();
  }

  /**
   * Returns is game over from the current MusketeersSlotGame state.
   * @returns {boolean} is game over from the current MusketeersSlotGame state.
   * @protected
   */
  protected get isGameOver(): boolean { return false; }

  /**
   * Recalculates game-specific layout after the viewport dimensions change.
   * @returns {void}
   * @protected
   */
  protected onViewportChanged(): void {}


}
