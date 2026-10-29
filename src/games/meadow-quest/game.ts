import {
  BaseGame,
  GameInput,
  GameContext,
  Collision2D,
  TouchControls,
  PlatformerController,
  QuestLog
} from '../../engine';

import { createLevel, type Coin, type Platform, PlatformerRenderer } from './';

/**
 * A small, original side-scrolling platformer built with the shared engine.
 * @class MeadowQuestGame
 */
export default class extends BaseGame {
  /**
   * Touch controls configuration or state owned by MeadowQuestGame.
   * @property {TouchControls} touchControls
   * @readonly
   * @private
   */
  private readonly touchControls = new TouchControls({ showVerticalControls: false, primaryAction: 'jump' });
  /**
   * Renderer configuration or state owned by MeadowQuestGame.
   * @property {PlatformerRenderer} renderer
   * @readonly
   * @private
   */
  private readonly renderer = new PlatformerRenderer();
  /**
   * Applies platform movement, gravity, buffered jumps, and coyote time.
   * @property {PlatformerController} playerController
   * @private
   * @readonly
   */
  private readonly playerController = new PlatformerController();
  /**
   * Tracks the collectible objective for the current run.
   * @property {QuestLog} questLog
   * @private
   * @readonly
   */
  private readonly questLog = new QuestLog();
  /**
   * World width configuration or state owned by MeadowQuestGame.
   * @property {3600} worldWidth
   * @readonly
   * @private
   */
  private readonly worldWidth = 3600;
  /**
   * Platforms configuration or state owned by MeadowQuestGame.
   * @property {Platform[]} platforms
   * @private
   */
  private platforms: Platform[] = [];
  /**
   * Coins configuration or state owned by MeadowQuestGame.
   * @property {Coin[]} coins
   * @private
   */
  private coins: Coin[] = [];
  /**
   * Player x configuration or state owned by MeadowQuestGame.
   * @property {number} playerX
   * @private
   */
  private playerX = 90;
  /**
   * Player y configuration or state owned by MeadowQuestGame.
   * @property {number} playerY
   * @private
   */
  private playerY = 0;
  /**
   * Horizontal velocity of the moving object.
   * @property {number} velocityX
   * @private
   */
  private velocityX = 0;
  /**
   * Vertical velocity of the moving object.
   * @property {number} velocityY
   * @private
   */
  private velocityY = 0;
  /**
   * Grounded configuration or state owned by MeadowQuestGame.
   * @property {boolean} grounded
   * @private
   */
  private grounded = false;
  /**
   * Facing configuration or state owned by MeadowQuestGame.
   * @property {number} facing
   * @private
   */
  private facing = 1;
  /**
   * Camera x configuration or state owned by MeadowQuestGame.
   * @property {number} cameraX
   * @private
   */
  private cameraX = 0;
  /**
   * Score configuration or state owned by MeadowQuestGame.
   * @property {number} score
   * @private
   */
  private score = 0;
  /**
   * Lives configuration or state owned by MeadowQuestGame.
   * @property {number} lives
   * @private
   */
  private lives = 3;
  /**
   * Won configuration or state owned by MeadowQuestGame.
   * @property {boolean} won
   * @private
   */
  private won = false;
  /**
   * Enemy x configuration or state owned by MeadowQuestGame.
   * @property {number} enemyX
   * @private
   */
  private enemyX = 0;
  /**
   * Enemy direction configuration or state owned by MeadowQuestGame.
   * @property {number} enemyDirection
   * @private
   */
  private enemyDirection = 1;
  /**
   * Damage cooldown configuration or state owned by MeadowQuestGame.
   * @property {number} damageCooldown
   * @private
   */
  private damageCooldown = 0;

  /**
   * Initializes MeadowQuestGame and its owned resources from the supplied arguments.
   * @constructor
   * @param {(() => void) | undefined} [onReturnToMenu] Callback invoked when this game returns to the selector.
   * @returns {void}
   * @public
   */
  public constructor(onReturnToMenu?: () => void) {
    super(onReturnToMenu, { showResetButton: false });
    this.registerCleanup(() => this.touchControls.dispose());
    this.restartGame();
    this.start();
  }

  /**
   * Returns is game over from the current MeadowQuestGame state.
   * @returns {boolean} is game over from the current MeadowQuestGame state.
   * @protected
   */
  protected get isGameOver(): boolean { return this.lives <= 0 || this.won; }

  /**
   * Advances game-specific simulation for one active frame.
   * @param {number} deltaSeconds Elapsed simulation time in seconds.
   * @returns {void}
   * @protected
   */
  protected updateGame(deltaSeconds: number): void {
    this.damageCooldown = Math.max(0, this.damageCooldown - deltaSeconds);
    this.renderer.update(deltaSeconds, this.velocityX !== 0);
    const viewport = GameContext.gameDimensionsModel;
    const height = viewport.getHeight();
    const floor = height * 0.79;
    this.velocityX = GameInput.axis('moveX');
    if (this.velocityX !== 0) this.facing = Math.sign(this.velocityX);
    if (GameInput.wasPressed('jump')) this.playerController.requestJump();
    this.playerController.body.x.set(this.playerX);
    this.playerController.body.y.set(this.playerY);
    this.playerController.body.velocityY.set(this.velocityY);
    this.playerController.update(deltaSeconds, this.velocityX, this.grounded);
    this.velocityY = this.playerController.body.velocityY();
    const previousY = this.playerY;
    this.playerY = this.playerController.body.y();
    this.playerX = Math.max(18, Math.min(this.worldWidth - 100, this.playerController.body.x()));
    this.grounded = false;

    const playerW = Math.max(25, height * 0.045);
    const playerH = playerW * 1.35;
    const worldFloor = floor;
    if (this.playerY + playerH >= worldFloor) {
      this.playerY = worldFloor - playerH;
      this.velocityY = 0;
      this.grounded = true;
    }
    for (const platform of this.platforms) {
      if (platform.kind === 'ground') continue;
      const result = Collision2D.resolveOneWayPlatform(
        this.playerX,
        this.playerY,
        playerW,
        playerH,
        previousY,
        this.velocityY,
        platform
      );
      if (result.landed) {
        this.playerY = result.resolvedY;
        this.velocityY = 0;
        this.grounded = true;
      }
    }
    this.playerController.body.x.set(this.playerX);
    this.playerController.body.y.set(this.playerY);
    this.playerController.body.velocityY.set(this.velocityY);

    this.enemyX += this.enemyDirection * 95 * deltaSeconds;
    if (this.enemyX < 760 || this.enemyX > 1050) this.enemyDirection *= -1;
    const enemyY = floor - playerH * 0.7;
    if (Math.abs(this.playerX - this.enemyX) < playerW * 0.8 && Math.abs(this.playerY - enemyY) < playerH * 0.7) {
      if (this.velocityY > 80 && this.playerY < enemyY) {
        this.velocityY = -height * 0.55;
        this.enemyX = -100;
        this.score += 100;
      } else if (this.damageCooldown <= 0) this.loseLife();
    }

    this.coins.forEach((coin) => {
      if (!coin.collected && Math.abs(this.playerX + playerW / 2 - coin.x) < playerW
        && Math.abs(this.playerY + playerH / 2 - coin.y) < playerH) {
        coin.collected = true;
        this.score += 50;
        this.questLog.advance('collect-meadow-coins', 0);
      }
    });
    if (this.playerY > height + 100) this.loseLife();
    if (this.playerX >= this.worldWidth - 140) this.won = true;
    this.cameraX = Math.max(0, Math.min(this.worldWidth - viewport.getWidth(), this.playerX - viewport.getWidth() * 0.36));
  }

  /**
   * Renders the game scene and its current HUD before shared engine controls.
   * @returns {void}
   * @protected
   */
  protected drawGame(): void {
    this.renderer.draw({
      cameraX: this.cameraX,
      playerX: this.playerX,
      playerY: this.playerY,
      facing: this.facing,
      score: this.score,
      lives: this.lives,
      won: this.won,
      enemyX: this.enemyX,
      moving: this.velocityX !== 0,
      platforms: this.platforms,
      coins: this.coins
    }, (text, x, y, size, color, align) => this.drawLabel(text, x, y, size, color, align));
    this.touchControls.draw();
  }

  /**
   * Restores game-specific state for a new run.
   * @returns {void}
   * @protected
   */
  protected restartGame(): void {
    const height = GameContext.gameDimensionsModel.getHeight();
    const level = createLevel(height, this.worldWidth);
    this.platforms = level.platforms;
    this.coins = level.coins;
    this.questLog.abandon('collect-meadow-coins');
    this.questLog.start('collect-meadow-coins', [Math.max(1, this.coins.length)]);
    this.playerX = 90;
    this.playerY = height * 0.79 - Math.max(25, height * 0.045) * 1.35;
    this.velocityX = 0;
    this.velocityY = 0;
    this.playerController.body.x.set(this.playerX);
    this.playerController.body.y.set(this.playerY);
    this.playerController.body.velocityX.set(0);
    this.playerController.body.velocityY.set(0);
    this.grounded = true;
    this.facing = 1;
    this.cameraX = 0;
    this.score = 0;
    this.lives = 3;
    this.won = false;
    this.enemyX = 850;
    this.enemyDirection = 1;
    this.damageCooldown = 0;
  }

  /**
   * Applies the lose life operation to MeadowQuestGame.
   * @returns {void}
   * @private
   */
  private loseLife(): void {
    this.lives -= 1;
    this.damageCooldown = 1;
    this.playerX = Math.max(20, this.playerX - 110);
    this.playerY = GameContext.gameDimensionsModel.getHeight() * 0.79 - Math.max(25, GameContext.gameDimensionsModel.getHeight() * 0.045) * 1.35;
    this.velocityY = 0;
    this.playerController.body.x.set(this.playerX);
    this.playerController.body.y.set(this.playerY);
    this.playerController.body.velocityX.set(0);
    this.playerController.body.velocityY.set(0);
    this.cameraX = Math.max(0, this.playerX - GameContext.gameDimensionsModel.getWidth() * 0.36);
  }

}
