import { signalValue } from 'reactive-values';
import { BaseGame, GameInput, GameContext, TouchControls, QuestLog, RigidBody2D,
  type PhysicsContactEvent } from '../../engine';
import { createLevel, type Coin, type Platform, PlatformerRenderer, MeadowPlayer, MeadowTerrain } from './';

/**
 * Playable platformer using scene physics, tilemap terrain, queries, and contact sensors.
 * @class MeadowQuestGame
 */
export default class extends BaseGame {
  /**
   * Movement and jump controls shared by phones and tablets.
   * @property {TouchControls} touchControls
   * @private
   */
  private readonly touchControls = new TouchControls({ showVerticalControls: false, primaryAction: 'jump' });
  /**
   * Presentation of the level without owning gameplay state.
   * @property {PlatformerRenderer} renderer
   * @private
   */
  private readonly renderer = new PlatformerRenderer();
  /**
   * Tracks collection progress for the current run.
   * @property {QuestLog} questLog
   * @private
   */
  private readonly questLog = new QuestLog();
  /**
   * Immutable horizontal extent of the level.
   * @property {number} worldWidth
   * @private
   */
  private readonly worldWidth = 3600;
  /**
   * Rendered platforms for the current viewport layout.
   * @property {SignalValue<readonly Platform[]>} platforms
   * @private
   */
  private readonly platforms = signalValue<readonly Platform[]>([]);
  /**
   * Collectibles, each with its own reactive collection state.
   * @property {SignalValue<readonly Coin[]>} coins
   * @private
   */
  private readonly coins = signalValue<readonly Coin[]>([]);
  /**
   * Hero owning the single source of position and velocity.
   * @property {SignalValue<MeadowPlayer | undefined>} player
   * @private
   */
  private readonly player = signalValue<MeadowPlayer | undefined>(undefined);
  /**
   * Scoped terrain adapter for the current layout.
   * @property {SignalValue<MeadowTerrain | undefined>} terrain
   * @private
   */
  private readonly terrain = signalValue<MeadowTerrain | undefined>(undefined);
  /**
   * Coin triggers matched to the collectible list by index.
   * @property {SignalValue<readonly RigidBody2D[]>} coinSensors
   * @private
   */
  private readonly coinSensors = signalValue<readonly RigidBody2D[]>([]);
  /**
   * Trigger marking the end of the level.
   * @property {SignalValue<RigidBody2D | undefined>} goal
   * @private
   */
  private readonly goal = signalValue<RigidBody2D | undefined>(undefined);
  /**
   * Kinematic enemy sensor, absent after being stomped.
   * @property {SignalValue<RigidBody2D | undefined>} enemy
   * @private
   */
  private readonly enemy = signalValue<RigidBody2D | undefined>(undefined);
  /**
   * Horizontal direction used by the hero animation.
   * @property {SignalValue<number>} facing
   * @private
   */
  private readonly facing = signalValue(1);
  /**
   * Points earned from collectible and enemy contacts.
   * @property {SignalValue<number>} score
   * @private
   */
  private readonly score = signalValue(0);
  /**
   * Remaining attempts for this run.
   * @property {SignalValue<number>} lives
   * @private
   */
  private readonly lives = signalValue(3);
  /**
   * Whether the hero entered the goal trigger.
   * @property {SignalValue<boolean>} won
   * @private
   */
  private readonly won = signalValue(false);
  /**
   * Seconds before another enemy contact may cause damage.
   * @property {SignalValue<number>} damageCooldown
   * @private
   */
  private readonly damageCooldown = signalValue(0);
  /**
   * Viewport height used by the current collider layout.
   * @property {SignalValue<number>} levelHeight
   * @private
   */
  private readonly levelHeight = signalValue(0);
  /**
   * Viewport width associated with the current responsive hero and camera.
   * @property {SignalValue<number>} levelWidth
   * @private
   */
  private readonly levelWidth = signalValue(0);

  /**
   * Registers touch input and contact subscriptions, then starts a fresh run.
   * @param {() => void} [onReturnToMenu] Callback returning to the game selector.
   * @returns {void}
   */
  public constructor(onReturnToMenu?: () => void) {
    super(onReturnToMenu, { showResetButton: false }, { gravityY: 1200, restitution: 0 });
    this.registerCleanup(() => this.touchControls.dispose());
    this.registerCleanup(this.worldScene.physics.onContact(event => this.handleContact(event)));
    this.registerCleanup(() => this.terrain()?.dispose());
    this.restartGame();
    this.start();
  }

  /**
   * Reports whether shared end-of-run controls should be displayed.
   * @returns {boolean} Whether the player won or exhausted all lives.
   */
  protected get isGameOver(): boolean { return this.lives() <= 0 || this.won(); }

  /**
   * Applies input only; BaseGame advances the world exactly once after this hook.
   * @param {number} deltaSeconds Elapsed frame time in seconds.
   * @returns {void}
   */
  protected updateGame(deltaSeconds: number): void {
    if (this.levelHeight() !== GameContext.gameDimensionsModel.getHeight() || this.levelWidth() !== GameContext.gameDimensionsModel.getWidth()) this.rebuildLayout();
    const player = this.player()!;
    this.damageCooldown.set(Math.max(0, this.damageCooldown() - deltaSeconds));
    const input = GameInput.axis('moveX');
    if (input !== 0) this.facing.set(Math.sign(input));
    if (GameInput.wasPressed('jump')) player.controller.requestJump();
    const feet = player.body.bounds().y + player.height;
    const grounded = player.body.velocityY >= -0.01 && [-0.35, 0, 0.35].some(offset => {
      const x = player.body.x + player.width * offset;
      return this.worldScene.physics.raycast({ x, y: feet - 0.2 }, { x, y: feet + 2 },
        { mask: 2, includeSensors: false }).some(hit => hit.normalY < -0.5);
    });
    player.controller.applyInput(deltaSeconds, input, grounded);
    this.renderer.update(deltaSeconds, input !== 0);
    const enemy = this.enemy();
    if (enemy) {
      if (enemy.x <= 760) enemy.setVelocity(95, 0);
      else if (enemy.x >= 1050) enemy.setVelocity(-95, 0);
    }
    if (player.top() > this.levelHeight() + 100) this.loseLife();
  }

  /**
   * Draws directly from reactive collider motion and collectible state.
   * @returns {void}
   */
  protected drawGame(): void {
    const player = this.player()!;
    this.renderer.draw({ cameraX: player.cameraX(), playerX: player.left(), playerY: player.top(),
      facing: this.facing(), score: this.score(), lives: this.lives(), won: this.won(),
      enemyX: this.enemy()?.x ?? -100, moving: player.body.velocityX !== 0,
      platforms: this.platforms(), coins: this.coins(), terrain: this.terrain()!.map
    }, (text, x, y, size, color, align) => this.drawLabel(text, x, y, size, color, align));
    this.touchControls.draw();
  }

  /**
   * Clears the old physics scope and restores collectible, hero, and enemy state.
   * @returns {void}
   */
  protected restartGame(): void {
    this.coins.set([]);
    this.player.set(undefined);
    this.enemy.set(undefined);
    this.levelHeight.set(0);
    this.facing.set(1);
    this.score.set(0);
    this.lives.set(3);
    this.won.set(false);
    this.damageCooldown.set(0);
    this.rebuildLayout();
    this.questLog.abandon('collect-meadow-coins');
    this.questLog.start('collect-meadow-coins', [Math.max(1, this.coins().length)]);
  }

  /**
   * Rebuilds responsive geometry while preserving run progress and hero motion.
   * @returns {void}
   * @private
   */
  private rebuildLayout(): void {
    const height = GameContext.gameDimensionsModel.getHeight();
    const previous = this.player();
    const oldHeight = this.levelHeight();
    const oldEnemy = this.enemy();
    const collected = this.coins().map(coin => coin.collected());
    this.terrain()?.dispose();
    this.worldScene.physics.clear();
    const level = createLevel(height, this.worldWidth);
    level.coins.forEach((coin, index) => coin.collected.set(collected[index] ?? false));
    this.platforms.set(level.platforms);
    this.coins.set(level.coins);
    const player = new MeadowPlayer(height, this.worldWidth, previous?.left() ?? 90,
      previous && oldHeight > 0 ? previous.top() + (height - oldHeight) * 0.79 : undefined);
    if (previous) player.body.setVelocity(previous.body.velocityX, previous.body.velocityY);
    this.player.set(player);
    this.terrain.set(new MeadowTerrain(this.worldScene.physics, level.platforms, this.worldWidth, height));
    this.worldScene.physics.addBody(player.body);
    const sensors = level.coins.map(coin => new RigidBody2D({ type: 'static', sensor: true,
      x: coin.x, y: coin.y, shape: { kind: 'circle', radius: Math.max(24, Math.min(42, height * 0.052)) * 0.22 },
      layer: 4, mask: 1 }));
    this.coinSensors.set(sensors);
    sensors.forEach((sensor, index) => { if (!level.coins[index].collected()) this.worldScene.physics.addBody(sensor); });
    const goal = new RigidBody2D({ type: 'static', sensor: true, x: this.worldWidth - 90, y: height * 0.395,
      shape: { kind: 'box', width: 100, height: height * 0.79 }, layer: 4, mask: 1 });
    this.goal.set(goal);
    this.worldScene.physics.addBody(goal);
    if (!previous || oldEnemy) {
      const scale = Math.max(24, Math.min(42, height * 0.052));
      const enemy = new RigidBody2D({ type: 'kinematic', sensor: true, x: oldEnemy?.x ?? 850,
        y: height * 0.79 - scale * 0.36, shape: { kind: 'circle', radius: scale * 0.38 }, layer: 4, mask: 1 });
      enemy.setVelocity(oldEnemy?.velocityX ?? 95, 0);
      this.enemy.set(enemy);
      this.worldScene.physics.addBody(enemy);
    }
    this.levelHeight.set(height);
    this.levelWidth.set(GameContext.gameDimensionsModel.getWidth());
  }

  /**
   * Applies gameplay effects only to contacts involving this run's hero.
   * @param {PhysicsContactEvent} event World contact lifecycle event.
   * @returns {void}
   * @private
   */
  private handleContact(event: PhysicsContactEvent): void {
    const player = this.player();
    if (!player || event.phase === 'end' || !event.sensor || this.isGameOver) return;
    const other = event.first === player.body ? event.second : event.second === player.body ? event.first : undefined;
    if (!other) return;
    const index = this.coinSensors().indexOf(other);
    if (index >= 0 && !this.coins()[index].collected()) {
      this.coins()[index].collected.set(true);
      this.score.set(this.score() + 50);
      this.questLog.advance('collect-meadow-coins', 0);
      this.worldScene.physics.removeBody(other);
    } else if (other === this.goal()) {
      this.won.set(true);
    } else if (other === this.enemy()) {
      if (player.body.velocityY > 80 && player.body.y < other.y) {
        player.body.setVelocity(player.body.velocityX, -this.levelHeight() * 0.55);
        this.enemy.set(undefined);
        this.worldScene.physics.removeBody(other);
        this.score.set(this.score() + 100);
      } else if (this.damageCooldown() <= 0) this.loseLife();
    }
  }

  /**
   * Respawns the hero without rebuilding terrain or resetting collected coins.
   * @returns {void}
   * @private
   */
  private loseLife(): void {
    const player = this.player()!;
    this.lives.set(this.lives() - 1);
    this.damageCooldown.set(1);
    player.body.setPosition(Math.max(20, player.left() - 110) + player.width / 2,
      this.levelHeight() * 0.79 - player.height / 2);
    player.body.setVelocity(0, 0);
  }
}
