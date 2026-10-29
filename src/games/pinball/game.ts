import { signalValue } from 'reactive-values';
import {
  BaseGame,
  CanvasIcon,
  GameBackground,
  GameContext,
  GameInput,
  GameLoader,
  TouchControls
} from '../../engine';
import heartSvg from 'lucide-static/icons/heart.svg?raw';

import { PinballBall, PinballBoard, PinballFlipper } from './';

/**
 * Pinball gameplay exercising reusable engine physics and collision entities.
 * @class PinballGame
 */
export default class extends BaseGame {
  /**
   * Full heart icon configuration or state owned by PinballGame.
   * @property {CanvasIcon} fullHeartIcon
   * @readonly
   * @private
   */
  private readonly fullHeartIcon = new CanvasIcon(heartSvg, '#ff5a6b', true);
  /**
   * Empty heart icon configuration or state owned by PinballGame.
   * @property {CanvasIcon} emptyHeartIcon
   * @readonly
   * @private
   */
  private readonly emptyHeartIcon = new CanvasIcon(heartSvg, '#5c657d');
  /**
   * Board configuration or state owned by PinballGame.
   * @property {PinballBoard} board
   * @readonly
   * @private
   */
  private readonly board = new PinballBoard();
  /**
   * Left flipper configuration or state owned by PinballGame.
   * @property {PinballFlipper} leftFlipper
   * @readonly
   * @private
   */
  private readonly leftFlipper = new PinballFlipper('left');
  /**
   * Right flipper configuration or state owned by PinballGame.
   * @property {PinballFlipper} rightFlipper
   * @readonly
   * @private
   */
  private readonly rightFlipper = new PinballFlipper('right');
  /**
   * Touch controls configuration or state owned by PinballGame.
   * @property {TouchControls} touchControls
   * @readonly
   * @private
   */
  private readonly touchControls = new TouchControls({ showVerticalControls: false, primaryAction: 'launch' });
  /**
   * Reactive ball state owned by PinballGame.
   * @property {SignalValue<PinballBall | undefined> & (() => PinballBall | undefined)} ball
   * @readonly
   * @private
   */
  private readonly ball = signalValue<PinballBall | undefined>(undefined);
  /**
   * Reactive lives state owned by PinballGame.
   * @property {SignalValue<number> & (() => number)} lives
   * @readonly
   * @private
   */
  private readonly lives = signalValue(3);
  /**
   * Reactive score state owned by PinballGame.
   * @property {SignalValue<number> & (() => number)} score
   * @readonly
   * @private
   */
  private readonly score = signalValue(0);
  /**
   * Reactive launched state owned by PinballGame.
   * @property {SignalValue<boolean> & (() => boolean)} launched
   * @readonly
   * @private
   */
  private readonly launched = signalValue(false);
  /**
   * Reactive plunger charge state owned by PinballGame.
   * @property {SignalValue<number> & (() => number)} plungerCharge
   * @readonly
   * @private
   */
  private readonly plungerCharge = signalValue(0);
  /**
   * Reactive bumper cooldown state owned by PinballGame.
   * @property {SignalValue<number> & (() => number)} bumperCooldown
   * @readonly
   * @private
   */
  private readonly bumperCooldown = signalValue(0);

  /**
   * Initializes PinballGame and its owned resources from the supplied arguments.
   * @constructor
   * @param {(() => void) | undefined} [onReturnToMenu] Callback invoked when this game returns to the selector.
   * @returns {void}
   * @public
   */
  public constructor(onReturnToMenu?: () => void) {
    super(onReturnToMenu, { showResetButton: false });
    this.registerCleanup(() => this.touchControls.dispose());
    const position = this.board.launchPosition();
    this.ball.set(new PinballBall(position.x, position.y, this.board.ballRadius()));
    this.start();
  }

  /**
   * Returns is game over from the current PinballGame state.
   * @returns {boolean} is game over from the current PinballGame state.
   * @protected
   */
  protected get isGameOver(): boolean { return this.lives() <= 0; }

  /**
   * Advances game-specific simulation for one active frame.
   * @param {number} deltaSeconds Elapsed simulation time in seconds.
   * @returns {void}
   * @protected
   */
  protected updateGame(deltaSeconds: number): void {
    this.board.update(deltaSeconds);
    const leftPressed = GameInput.isDown('moveLeft');
    const rightPressed = GameInput.isDown('moveRight');
    const spaceHeld = GameInput.isDown('launch');
    if (GameInput.wasPressed('launch') && !this.launched()) this.plungerCharge.set(0);
    if (spaceHeld && !this.launched()) {
      this.plungerCharge.set(Math.min(1, this.plungerCharge() + deltaSeconds * 0.75));
    }
    if (GameInput.wasReleased('launch')) this.launch();
    const bounds = this.board.bounds;
    this.leftFlipper.update(bounds, leftPressed, deltaSeconds);
    this.rightFlipper.update(bounds, rightPressed, deltaSeconds);
    if (!this.launched()) return;

    const ball = this.ball();
    if (ball === undefined) return;
    const stepCount = Math.max(1, Math.ceil(deltaSeconds / (1 / 120)));
    const stepSeconds = deltaSeconds / stepCount;
    let hitMask = 0;
    let flipperScore = 0;
    let flipperHit = false;
    let ballLost = false;
    for (let step = 0; step < stepCount; step++) {
      ball.update(stepSeconds);
      this.board.releaseFromShooter(ball);
      hitMask |= this.board.resolve(ball.body);
      const descending = ball.body.velocityY > 0;
      const leftHit = this.leftFlipper.collide(ball.body, leftPressed);
      const rightHit = this.rightFlipper.collide(ball.body, rightPressed);
      if (descending && ((leftHit && leftPressed) || (rightHit && rightPressed))) {
        flipperHit = true;
      }
      if (ball.body.y - ball.body.radius > bounds.y + bounds.height) {
        ballLost = true;
        break;
      }
    }
    if (flipperHit) flipperScore = 25;
    if (hitMask > 0 && this.bumperCooldown() <= 0) {
      this.score.set(this.score() + flipperScore + 100 * this.countBits(hitMask & 0b111)
        + 500 * this.countBits(hitMask >> 3));
      this.bumperCooldown.set(0.12);
    } else if (flipperScore > 0) {
      this.score.set(this.score() + flipperScore);
    }
    this.bumperCooldown.set(Math.max(0, this.bumperCooldown() - deltaSeconds));

    if (ballLost) {
      const remainingLives = this.lives() - 1;
      this.lives.set(remainingLives);
      this.launched.set(false);
      if (remainingLives > 0) {
        const start = this.board.launchPosition();
        this.ball.set(new PinballBall(start.x, start.y, this.board.ballRadius()));
      }
    }
  }

  /**
   * Renders the game scene and its current HUD before shared engine controls.
   * @returns {void}
   * @protected
   */
  protected drawGame(): void {
    const viewport = GameContext.gameDimensionsModel;
    const width = viewport.getWidth();
    const height = viewport.getHeight();
    GameContext.clear();
    GameBackground.draw(
      GameLoader.getImage('background1080x1920'),
      GameLoader.getImage('background1920x1080'),
      'rgba(8, 13, 31, 0.76)'
    );
    this.drawLabel('SPACE CADET', width * 0.5, Math.max(32, height * 0.06),
      Math.max(22, Math.min(36, GameContext.viewportUnit() * 0.055)), '#ffe18a', 'center', width * 0.84);
    this.drawLabel(`SCORE  ${this.score()}`, width * 0.5, height * 0.105,
      Math.max(14, Math.min(19, GameContext.viewportUnit() * 0.03)), '#ffffff', 'center', width * 0.86);
    this.drawLives(width, height);
    this.worldActors.setObjects([
      this.board,
      this.leftFlipper,
      this.rightFlipper,
      ...(this.ball() === undefined ? [] : [this.ball()!])
    ]);
    this.drawWorldScene();
    this.touchControls.draw();
    if (!this.launched() && !GameContext.isMobileDevice) {
      const panelWidth = Math.min(500, width * 0.9);
      const panelY = Math.min(height - 40, this.board.bounds.y + this.board.bounds.height + 12);
      GameContext.drawRect((width - panelWidth) * 0.5, panelY, panelWidth, 32, 'rgba(8, 17, 36, 0.88)');
      this.drawLabel('← / → FLIPPERS   •   HOLD SPACE, RELEASE TO LAUNCH', width * 0.5, panelY + 20,
        Math.max(10, Math.min(14, GameContext.viewportUnit() * 0.022)), '#d8e7ff', 'center', panelWidth - 18);
    }
  }

  /**
   * Restores game-specific state for a new run.
   * @returns {void}
   * @protected
   */
  protected restartGame(): void {
    this.lives.set(3);
    this.score.set(0);
    this.launched.set(false);
    this.plungerCharge.set(0);
    this.bumperCooldown.set(0);
    const start = this.board.launchPosition();
    this.ball.set(new PinballBall(start.x, start.y, this.board.ballRadius()));
  }

  /**
   * Recalculates game-specific layout after the viewport dimensions change.
   * @returns {void}
   * @protected
   */
  protected onViewportChanged(): void {
    if (this.launched()) return;
    const start = this.board.launchPosition();
    this.ball.set(new PinballBall(start.x, start.y, this.board.ballRadius()));
  }

  /**
   * Launches pinball game for PinballGame.
   * @returns {void}
   * @private
   */
  private launch(): void {
    if (this.launched() || this.lives() <= 0) return;
    const ball = this.ball();
    if (ball === undefined) return;
    const launchSpeed = 820 + this.plungerCharge() * 400;
    ball.body.setVelocity(0, -launchSpeed);
    this.plungerCharge.set(0);
    this.launched.set(true);
  }

  /**
   * Renders lives for PinballGame.
   * @param {number} width Width of the represented area.
   * @param {number} height Height of the represented area.
   * @returns {void}
   * @private
   */
  private drawLives(width: number, height: number): void {
    const size = Math.max(16, Math.min(24, GameContext.viewportUnit() * 0.034));
    const spacing = size + 5;
    const right = width * 0.94;
    const y = height * 0.105 - size * 0.5;
    for (let index = 0; index < 3; index++) {
      const icon = index < this.lives() ? this.fullHeartIcon : this.emptyHeartIcon;
      icon.draw(right - (2 - index) * spacing - size, y, size);
    }
  }

  /**
   * Counts set bits in a numeric hit mask.
   * @param {number} mask The mask supplied to this operation.
   * @returns {number} Counts set bits in a numeric hit mask.
   * @private
   */
  private countBits(mask: number): number {
    let count = 0;
    for (let value = mask; value !== 0; value &= value - 1) count++;
    return count;
  }
}
