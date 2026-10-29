import { signalValue } from 'reactive-values';
import {
  BaseGame,
  CanvasIcon,
  GameBackground,
  GameContext,
  GameInput,
  GameLoader,
  TouchControls,
  type CollisionRect,
  type PhysicsContactEvent
} from '../../engine';
import heartSvg from 'lucide-static/icons/heart.svg?raw';

import { PinballBall, PinballBoard, PinballFlipper, PinballPhysics } from './';

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
   * Adapter owning all table, sensor, and flipper collider registrations.
   * @property {PinballPhysics} physics
   * @private
   */
  private readonly physics: PinballPhysics;
  /**
   * Independent bumper cooldowns prevent repeated impulses from retained contacts.
   * @property {readonly SignalValue<number>[]} bumperCooldowns
   * @private
   */
  private readonly bumperCooldowns = [signalValue(0), signalValue(0), signalValue(0)];
  /**
   * Independent cooldowns for the two powered slingshots.
   * @property {readonly SignalValue<number>[]} slingCooldowns
   * @private
   */
  private readonly slingCooldowns = [signalValue(0), signalValue(0)];

  /**
   * Initializes PinballGame and its owned resources from the supplied arguments.
   * @constructor
   * @param {(() => void) | undefined} [onReturnToMenu] Callback invoked when this game returns to the selector.
   * @returns {void}
   * @public
   */
  public constructor(onReturnToMenu?: () => void) {
    super(onReturnToMenu, { showResetButton: false }, { gravityY: 680, fixedTimeStep: 1 / 120, maxSubSteps: 6 });
    this.physics = new PinballPhysics(this.worldScene.physics, this.board, [this.leftFlipper, this.rightFlipper]);
    this.registerCleanup(() => this.physics.dispose());
    this.registerCleanup(this.worldScene.physics.onBeforeStep(seconds => this.preparePhysicsStep(seconds)));
    this.registerCleanup(this.worldScene.physics.onContact(event => this.handleContact(event)));
    this.registerCleanup(() => this.touchControls.dispose());
    this.restartGame();
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
    this.board.resize(GameContext.gameDimensionsModel.getWidth(), GameContext.gameDimensionsModel.getHeight());
    const previous = this.physics.syncLayout();
    if (previous) this.resizeBall(previous);
    this.board.update(deltaSeconds);
    const spaceHeld = GameInput.isDown('launch');
    if (GameInput.wasPressed('launch') && !this.launched()) this.plungerCharge.set(0);
    if (spaceHeld && !this.launched()) {
      this.plungerCharge.set(Math.min(1, this.plungerCharge() + deltaSeconds * 0.75));
    }
    if (GameInput.wasReleased('launch')) this.launch();
  }

  /**
   * Prepares powered elements at physics frequency without integrating the ball.
   * @param {number} seconds Fixed simulation interval in seconds.
   * @returns {void}
   * @private
   */
  private preparePhysicsStep(seconds: number): void {
    for (const cooldown of [...this.bumperCooldowns, ...this.slingCooldowns]) cooldown.set(Math.max(0, cooldown() - seconds));
    this.leftFlipper.update(GameInput.isDown('moveLeft'), seconds);
    this.rightFlipper.update(GameInput.isDown('moveRight'), seconds);
    if (this.launched()) this.ball()?.applyDamping(seconds);
  }

  /**
   * Applies gameplay effects to world-confirmed contacts with the active ball.
   * @param {PhysicsContactEvent} event Committed fixed-step contact transition.
   * @returns {void}
   * @private
   */
  private handleContact(event: PhysicsContactEvent): void {
    const ball = this.ball();
    if (!ball || !this.launched() || event.phase === 'end') return;
    const other = event.first === ball.body ? event.second : event.second === ball.body ? event.first : undefined;
    if (!other) return;
    if (other === this.physics.drain()) { this.loseBall(); return; }
    if (other === this.physics.shooterExit() && ball.isInShooterLane && ball.body.velocityY < 0) {
      const speed = Math.max(360, Math.min(520, Math.abs(ball.body.velocityY) * 0.42));
      ball.leaveShooter(-speed, 0);
      ball.body.setPosition(ball.body.x, this.board.shooterExitY - ball.body.radius - 1);
      return;
    }
    const bumper = this.physics.bumpers().indexOf(other);
    if (bumper >= 0 && this.bumperCooldowns[bumper]() <= 0) {
      const dx = ball.body.x - other.x, dy = ball.body.y - other.y;
      const distance = Math.hypot(dx, dy) || 1;
      ball.body.addVelocity(dx / distance * 420, dy / distance * 420);
      this.score.set(this.score() + 100);
      this.bumperCooldowns[bumper].set(0.24);
      this.board.playBumper(bumper);
    }
    if (event.phase === 'begin' && this.physics.targets().includes(other)) this.score.set(this.score() + 500);
    const sling = this.physics.slingshots().indexOf(other);
    if (sling >= 0 && this.slingCooldowns[sling]() <= 0) {
      ball.body.addVelocity(sling === 0 ? 210 : -210, -300);
      this.slingCooldowns[sling].set(0.22);
    }
    const normalY = event.first === other ? event.normalY : -event.normalY;
    for (const flipper of [this.leftFlipper, this.rightFlipper]) {
      if (normalY < -0.1 && flipper.bodies().includes(other) && flipper.strike(ball.body)) {
        this.score.set(this.score() + 25);
      }
    }
  }

  /**
   * Removes a drained ball once and prepares an unregistered ball for the next launch.
   * @returns {void}
   * @private
   */
  private loseBall(): void {
    const ball = this.ball();
    if (!ball || !this.launched()) return;
    this.launched.set(false);
    this.ball.set(undefined);
    this.worldScene.physics.removeBody(ball.body);
    this.lives.set(this.lives() - 1);
    this.plungerCharge.set(0);
    if (this.lives() > 0) {
      const start = this.board.launchPosition();
      this.ball.set(new PinballBall(start.x, start.y, this.board.ballRadius()));
    }
  }

  /**
   * Preserves normalized position, shooter state, and velocity across layout changes.
   * @param {CollisionRect} previous Table bounds before the resize.
   * @returns {void}
   * @private
   */
  private resizeBall(previous: CollisionRect): void {
    const ball = this.ball();
    if (!ball) return;
    const bounds = this.board.bounds, radius = this.board.ballRadius();
    const start = this.board.launchPosition();
    const x = this.launched() ? bounds.x + (ball.body.x - previous.x) / previous.width * bounds.width : start.x;
    const y = this.launched() ? bounds.y + (ball.body.y - previous.y) / previous.height * bounds.height : start.y;
    const next = new PinballBall(Math.max(bounds.x + radius, Math.min(bounds.x + bounds.width - radius, x)), y, radius);
    const vx = ball.body.velocityX * bounds.width / previous.width;
    const vy = ball.body.velocityY * bounds.height / previous.height;
    if (!ball.isInShooterLane) next.leaveShooter(vx, vy);
    else next.body.setVelocity(vx, vy);
    this.ball.set(next);
    this.worldScene.physics.removeBody(ball.body);
    if (this.launched()) this.worldScene.physics.addBody(next.body);
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
    for (const cooldown of [...this.bumperCooldowns, ...this.slingCooldowns]) cooldown.set(0);
    const ball = this.ball();
    this.ball.set(undefined);
    if (ball) this.worldScene.physics.removeBody(ball.body);
    this.leftFlipper.reset(); this.rightFlipper.reset();
    this.physics.syncLayout(true);
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
    this.worldScene.physics.addBody(ball.body);
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

}
