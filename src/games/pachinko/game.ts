import { signalValue } from 'reactive-values';
import {
  BaseGame,
  Button,
  Collision2D,
  GameBackground,
  GameContext,
  GameEvents,
  GameInput,
  GameLoader,
  Texture,
  type PhysicsContactEvent,
  type GamePointer
} from '../../engine';

import { PachinkoBall, PachinkoBoard, PachinkoPhysics } from './';

/**
 * Pachinko-style Keno game used to exercise engine physics and collision primitives.
 * @class PachinkoGame
 */
export default class extends BaseGame {
  /**
   * Cost of a single drop, in credits.
   * @property {number} bet
   * @private
   */
  private readonly bet = 5;
  /**
   * Payout multiplier for each of the nine lanes.
   * @property {readonly number[]} payouts
   * @private
   */
  private readonly payouts = [8, 4, 2, 1, 0, 1, 2, 4, 8] as const;
  /**
   * Scene-owned colliders matching the rendered board.
   * @property {PachinkoPhysics} physics
   * @private
   */
  private readonly physics: PachinkoPhysics;
  /**
   * Board configuration or state owned by PachinkoGame.
   * @property {PachinkoBoard} board
   * @readonly
   * @private
   */
  private readonly board = new PachinkoBoard();
  /**
   * Reactive credits state owned by PachinkoGame.
   * @property {SignalValue<number> & (() => number)} credits
   * @readonly
   * @private
   */
  private readonly credits = signalValue(100);
  /**
   * Reactive selected lane state owned by PachinkoGame.
   * @property {SignalValue<number> & (() => number)} selectedLane
   * @readonly
   * @private
   */
  private readonly selectedLane = signalValue(4);
  /**
   * Reactive ball state owned by PachinkoGame.
   * @property {SignalValue<PachinkoBall | undefined> & (() => PachinkoBall | undefined)} ball
   * @readonly
   * @private
   */
  private readonly ball = signalValue<PachinkoBall | undefined>(undefined);
  /**
   * Reactive status state owned by PachinkoGame.
   * @property {SignalValue<string> & (() => string)} status
   * @readonly
   * @private
   */
  private readonly status = signalValue('SELECT A LANE, THEN DROP');
  /**
   * Drop button configuration or state owned by PachinkoGame.
   * @property {Button} dropButton
   * @readonly
   * @private
   */
  private readonly dropButton: Button;
  /**
   * Remove pointer listener configuration or state owned by PachinkoGame.
   * @property {() => void} removePointerListener
   * @readonly
   * @private
   */
  private readonly removePointerListener: () => void;

  /**
   * Initializes PachinkoGame and its owned resources from the supplied arguments.
   * @constructor
   * @param {(() => void) | undefined} [onReturnToMenu] Callback invoked when this game returns to the selector.
   * @returns {void}
   * @public
   */
  public constructor(onReturnToMenu?: () => void) {
    super(onReturnToMenu, { showResetButton: false }, { gravityY: 720, fixedTimeStep: 1 / 120, restitution: 0.68 });
    this.physics = new PachinkoPhysics(this.worldScene.physics, this.board);
    this.registerCleanup(() => this.physics.dispose());
    this.registerCleanup(this.worldScene.physics.onContact(event => this.handleContact(event)));
    this.dropButton = new Button(new Texture({}, 0, 0), { onClick: () => this.dropBall() });
    this.registerCleanup(() => this.dropButton.destroy());
    this.removePointerListener = GameEvents.addPointerDownListener(this.handlePointerDown);
    this.registerCleanup(this.removePointerListener);
    this.start();
  }

  /**
   * Returns is game over from the current PachinkoGame state.
   * @returns {boolean} is game over from the current PachinkoGame state.
   * @protected
   */
  protected get isGameOver(): boolean {
    return this.credits() < this.bet && this.ball() === undefined;
  }

  /**
   * Advances game-specific simulation for one active frame.
   * @param {number} _deltaSeconds Frame duration; PhysicsWorld performs integration.
   * @returns {void}
   * @protected
   */
  protected updateGame(_deltaSeconds: number): void {
    this.board.resize(GameContext.gameDimensionsModel.getWidth(), GameContext.gameDimensionsModel.getHeight());
    const previous = this.physics.syncLayout();
    const ball = this.ball();
    if (ball && previous) {
      const bounds = this.board.bounds;
      const radius = ball.body.radius;
      const x = bounds.x + (ball.body.x - previous.x) / previous.width * bounds.width;
      const y = bounds.y + (ball.body.y - previous.y) / previous.height * bounds.height;
      ball.body.setPosition(Math.max(bounds.x + radius, Math.min(bounds.x + bounds.width - radius, x)), y);
    }
    if (GameInput.wasPressed('drop')) this.dropBall();
    this.dropButton.setDisabled(this.ball() !== undefined || this.credits() < this.bet);
  }

  /**
   * Applies peg deflection and payout once per matching world contact.
   * @param {PhysicsContactEvent} event Fixed-step contact transition.
   * @returns {void}
   * @private
   */
  private handleContact(event: PhysicsContactEvent): void {
    const ball = this.ball();
    if (!ball) return;
    const other = event.first === ball.body ? event.second : event.second === ball.body ? event.first : undefined;
    if (!other) return;
    const peg = this.physics.pegs().indexOf(other);
    if (peg >= 0) {
      if (event.phase === 'end') ball.clearPegContact();
      else if (event.phase === 'begin') ball.deflectFromPeg(other.x, peg);
    }
    const lane = this.physics.payoutSensors().indexOf(other);
    if (lane < 0 || event.phase !== 'begin') return;
    const payout = this.bet * this.payouts[lane];
    this.credits.set(this.credits() + payout);
    this.status.set(payout > 0 ? `LANE ${lane + 1}  •  +${payout} CREDITS` : 'EMPTY LANE  •  TRY AGAIN');
    this.ball.set(undefined);
    this.worldScene.physics.removeBody(ball.body);
  }

  /**
   * Renders the game scene and its current HUD before shared engine controls.
   * @returns {void}
   * @protected
   */
  protected drawGame(): void {
    const dimensions = GameContext.gameDimensionsModel;
    const width = dimensions.getWidth();
    const height = dimensions.getHeight();
    GameContext.clear();
    GameBackground.draw(
      GameLoader.getImage('background1080x1920'),
      GameLoader.getImage('background1920x1080'),
      'rgba(7, 10, 27, 0.7)'
    );
    this.board.draw(this.selectedLane(), this.payouts);
    this.worldActors.setObjects(this.ball() === undefined ? [] : [this.ball()!]);
    this.drawWorldScene();

    this.drawLabel('PACHINKO KENO', width * 0.5, Math.max(34, height * 0.065),
      Math.max(20, Math.min(34, GameContext.viewportUnit() * 0.052)), '#ffe18a', 'center', width * 0.84);
    this.drawLabel(`CREDITS  ${this.credits()}     BET  ${this.bet}`, width * 0.5, height * 0.115,
      Math.max(14, Math.min(20, GameContext.viewportUnit() * 0.03)), '#ffffff', 'center', width * 0.86);
    this.drawLabel(this.status(), width * 0.5, height * 0.94,
      Math.max(12, Math.min(16, GameContext.viewportUnit() * 0.024)), '#d8e7ff', 'center', width * 0.86);
    this.drawDropButton(width, height);
  }

  /**
   * Restores game-specific state for a new run.
   * @returns {void}
   * @protected
   */
  protected restartGame(): void {
    this.credits.set(100);
    this.selectedLane.set(4);
    const ball = this.ball();
    this.ball.set(undefined);
    if (ball) this.worldScene.physics.removeBody(ball.body);
    this.status.set('SELECT A LANE, THEN DROP');
  }

  /**
   * Callback handling pointer down for PachinkoGame.
   * @property {(pointer: GamePointer) => void} handlePointerDown
   * @readonly
   * @private
   */
  private readonly handlePointerDown = (pointer: GamePointer): void => {
    if (this.controls.isPaused || this.ball() !== undefined) return;
    const bounds = this.board.bounds;
    if (!Collision2D.containsPoint(
      pointer.x, pointer.y, bounds.x, bounds.y, bounds.width, bounds.height
    )) return;
    this.selectedLane.set(this.board.laneAt(pointer.x));
  };

  /**
   * Drops ball for PachinkoGame.
   * @returns {void}
   * @private
   */
  private dropBall(): void {
    if (this.ball() !== undefined || this.credits() < this.bet) return;
    const radius = Math.max(7, Math.min(10, GameContext.viewportUnit() * 0.015));
    this.credits.set(this.credits() - this.bet);
    this.status.set('GOOD LUCK!');
    const ball = new PachinkoBall(
      this.board.laneCenter(this.selectedLane()),
      this.board.launchY(radius),
      radius
    );
    this.ball.set(ball);
    this.worldScene.physics.addBody(ball.body);
  }

  /**
   * Renders drop button for PachinkoGame.
   * @param {number} width Width of the represented area.
   * @param {number} height Height of the represented area.
   * @returns {void}
   * @private
   */
  private drawDropButton(width: number, height: number): void {
    const buttonWidth = Math.min(190, width * 0.42);
    const buttonHeight = Math.max(42, Math.min(54, GameContext.viewportUnit() * 0.09));
    const x = width * 0.5;
    const y = Math.min(height - buttonHeight * 0.5 - 28, this.board.bounds.y + this.board.bounds.height + 40);
    this.dropButton.dimensions.setPosition(x, y);
    this.dropButton.dimensions.setSize(buttonWidth, buttonHeight);
    this.dropButton.setDisabled(this.ball() !== undefined || this.credits() < this.bet);
    const disabled = this.ball() !== undefined || this.credits() < this.bet;
    GameContext.drawRect(x - buttonWidth * 0.5, y - buttonHeight * 0.5, buttonWidth, buttonHeight, '#11172e');
    GameContext.drawRect(x - buttonWidth * 0.5 + 3, y - buttonHeight * 0.5 + 3,
      buttonWidth - 6, buttonHeight - 6, disabled ? '#515b71' : '#d57b27');
    GameContext.drawText('DROP BALL  •  SPACE', x, y + buttonHeight * 0.12,
      Math.max(13, buttonHeight * 0.29), '#ffffff', 'center', buttonWidth - 12);
  }
}
