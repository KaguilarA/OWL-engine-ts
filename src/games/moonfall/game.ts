import { signalValue, type SignalValue } from 'reactive-values';
import {
  BaseGame,
  Collision2D,
  GameContext,
  GameEvents,
  MathUtils,
  PlatformerController,
  Projectile,
  Weapon
} from '../../engine';
import type { CollisionRect } from '../../engine';
import MoonWisp from './wisp';

const ROOM_NAMES = ['MOONLIT GROVE', 'SUNKEN AQUEDUCT', 'SUNDERED CITADEL'] as const;

/**
 * A side-scrolling metroidvania about opening a route through an ancient citadel.
 * @class MoonfallGame
 */
export default class MoonfallGame extends BaseGame {
  /**
   * Platformer movement, jump buffering, and coyote time for the explorer.
   * @property {PlatformerController} controller
   * @private
   * @readonly
   */
  private readonly controller = new PlatformerController(0, 0, {
    moveSpeed: 260,
    gravityY: 1250,
    jumpVelocity: 590,
    jumpBufferDuration: 0.14,
    coyoteDuration: 0.12
  });

  /**
   * Ranged weapon used to defend against the citadel's crystal spirit.
   * @property {Weapon} weapon
   * @private
   * @readonly
   */
  private readonly weapon = new Weapon(0.38);

  /**
   * Active player bolts moving through the world.
   * @property {SignalValue<Projectile[]>} projectiles
   * @private
   * @readonly
   */
  private readonly projectiles: SignalValue<Projectile[]> = signalValue<Projectile[]>([]);

  /**
   * Patrolling crystal spirit that guards the final beacon.
   * @property {MoonWisp} wisp
   * @private
   * @readonly
   */
  private readonly wisp: MoonWisp;

  /**
   * Number of remaining lantern hearts.
   * @property {SignalValue<number>} hearts
   * @private
   * @readonly
   */
  private readonly hearts: SignalValue<number> = signalValue(3);

  /**
   * Whether the moon shard has unlocked the dash ability.
   * @property {SignalValue<boolean>} hasDash
   * @private
   * @readonly
   */
  private readonly hasDash: SignalValue<boolean> = signalValue(false);

  /**
   * Whether the sealed crystal gate has been broken.
   * @property {SignalValue<boolean>} gateOpen
   * @private
   * @readonly
   */
  private readonly gateOpen: SignalValue<boolean> = signalValue(false);

  /**
   * Whether the explorer reached the citadel's exit.
   * @property {SignalValue<boolean>} completed
   * @private
   * @readonly
   */
  private readonly completed: SignalValue<boolean> = signalValue(false);

  /**
   * Edge state for jump input.
   * @property {SignalValue<boolean>} jumpWasPressed
   * @private
   * @readonly
   */
  private readonly jumpWasPressed: SignalValue<boolean> = signalValue(false);

  /**
   * Edge state for dash input.
   * @property {SignalValue<boolean>} dashWasPressed
   * @private
   * @readonly
   */
  private readonly dashWasPressed: SignalValue<boolean> = signalValue(false);

  /**
   * Horizontal facing direction used by the dash.
   * @property {SignalValue<number>} facing
   * @private
   * @readonly
   */
  private readonly facing: SignalValue<number> = signalValue(1);

  /**
   * Remaining double-jump count before the next landing.
   * @property {SignalValue<number>} jumpsUsed
   * @private
   * @readonly
   */
  private readonly jumpsUsed: SignalValue<number> = signalValue(0);

  /**
   * Remaining duration of the current dash.
   * @property {SignalValue<number>} dashRemaining
   * @private
   * @readonly
   */
  private readonly dashRemaining: SignalValue<number> = signalValue(0);

  /**
   * Time until the dash ability can be used again.
   * @property {SignalValue<number>} dashCooldown
   * @private
   * @readonly
   */
  private readonly dashCooldown: SignalValue<number> = signalValue(0);

  /**
   * Checkpoint position reached after acquiring the moon shard.
   * @property {SignalValue<number>} checkpointX
   * @private
   * @readonly
   */
  private readonly checkpointX: SignalValue<number> = signalValue(0);

  /**
   * Current short instruction or item pickup message.
   * @property {SignalValue<string>} message
   * @private
   * @readonly
   */
  private readonly message: SignalValue<string> = signalValue('FIND THE MOON SHARD. IT AWAKENS DASH AND DOUBLE JUMP.');

  /**
   * Creates the explorer and starts the shared game lifecycle.
   * @param onReturnToMenu Callback used by the shared controls to return to the selector.
   * @public
   * @return {void}
   */
  public constructor(onReturnToMenu?: () => void) {
    super(onReturnToMenu);
    const width = GameContext.gameDimensionsModel.getWidth();
    this.wisp = new MoonWisp(width * 2.65, width * 2.54, width * 2.78, 5);
    this.restartGame();
    this.start();
  }

  /**
   * Reports whether the explorer finished the citadel or ran out of hearts.
   * @protected
   * @return {boolean}
   */
  protected get isGameOver(): boolean {
    return this.completed() || this.hearts() <= 0;
  }

  /**
   * Reads movement, jumping, dash, platform collisions, and room progression.
   * @param deltaSeconds Duration of the frame in seconds.
   * @protected
   * @return {void}
   */
  protected updateGame(deltaSeconds: number): void {
    if (this.isGameOver) return;
    const viewport = GameContext.gameDimensionsModel;
    const width = viewport.getWidth();
    const height = viewport.getHeight();
    const playerWidth = Math.max(28, height * 0.055);
    const playerHeight = playerWidth * 1.55;
    const floor = height * 0.82;
    const worldWidth = width * ROOM_NAMES.length;
    const previousY = this.controller.body.y();
    const horizontal = this.readHorizontalInput();
    this.updateFacing(horizontal);
    this.updateJumpInput();
    this.updateDashInput(deltaSeconds, width);
    this.advanceController(deltaSeconds, horizontal);
    const drawingScale = MathUtils.clamp(Math.min(width, height) / 720, 0.58, 1.15);
    this.updateWispAndProjectiles(deltaSeconds, playerWidth, playerHeight, floor, height, drawingScale);
    this.resolvePlatforms(previousY, playerWidth, playerHeight, floor, width, height);
    this.resolveGate(playerWidth, width, height);
    this.resolvePickup(playerWidth, playerHeight, floor, width);
    this.resolveWorldBounds(playerHeight, floor, worldWidth);
    this.resolveExit(playerWidth, worldWidth);
  }

  /**
   * Draws the three connected regions, ability gate, shard, and explorer.
   * @protected
   * @return {void}
   */
  protected drawGame(): void {
    const viewport = GameContext.gameDimensionsModel;
    const width = viewport.getWidth();
    const height = viewport.getHeight();
    const scale = MathUtils.clamp(Math.min(width, height) / 720, 0.58, 1.15);
    const worldWidth = width * ROOM_NAMES.length;
    const cameraX = MathUtils.clamp(this.controller.body.x() - width * 0.42, 0, worldWidth - width);
    const floor = height * 0.82;
    GameContext.clear();
    this.drawSky(width, height, cameraX, scale);
    this.drawTerrain(width, height, cameraX, floor);
    this.drawPlatforms(width, height, cameraX);
    this.drawMoonShard(width, height, cameraX, scale);
    this.drawGate(width, height, cameraX, floor, scale);
    this.drawWisp(width, height, cameraX, floor, scale);
    this.drawProjectiles(cameraX, scale);
    this.drawExplorer(height, cameraX, scale);
    this.drawHud(width, height, cameraX, scale);
    if (this.isGameOver) this.drawEnding(width, height, scale);
  }

  /**
   * Restores movement, hearts, checkpoint, and progression for a new run.
   * @protected
   * @return {void}
   */
  protected restartGame(): void {
    const width = GameContext.gameDimensionsModel.getWidth();
    const height = GameContext.gameDimensionsModel.getHeight();
    const playerWidth = Math.max(28, height * 0.055);
    const floor = height * 0.82;
    this.controller.body.setPosition(width * 0.08, floor - playerWidth * 1.55);
    this.controller.body.stop();
    this.controller.grounded.set(true);
    this.hearts.set(3);
    this.hasDash.set(false);
    this.gateOpen.set(false);
    this.completed.set(false);
    this.jumpWasPressed.set(false);
    this.dashWasPressed.set(false);
    this.facing.set(1);
    this.jumpsUsed.set(0);
    this.dashRemaining.set(0);
    this.dashCooldown.set(0);
    this.checkpointX.set(width * 0.08);
    this.message.set('FIND THE MOON SHARD. IT AWAKENS DASH AND DOUBLE JUMP.');
    this.wisp.reset();
    this.weapon.cooldownRemaining.set(0);
    this.projectiles.set([]);
  }

  /**
   * Reads the current horizontal direction from keyboard input.
   * @private
   * @return {number}
   */
  private readHorizontalInput(): number {
    return Number(GameEvents.isKeyPressed('ArrowRight') || GameEvents.isKeyPressed('d'))
      - Number(GameEvents.isKeyPressed('ArrowLeft') || GameEvents.isKeyPressed('a'));
  }

  /**
   * Stores the last horizontal direction when movement input is present.
   * @param horizontal Horizontal input in the range from negative one to one.
   * @private
   * @return {void}
   */
  private updateFacing(horizontal: number): void {
    if (horizontal !== 0) this.facing.set(Math.sign(horizontal));
  }

  /**
   * Queues a grounded jump or performs the unlocked midair double jump.
   * @private
   * @return {void}
   */
  private updateJumpInput(): void {
    const pressed = GameEvents.isKeyPressed(' ') || GameEvents.isKeyPressed('ArrowUp')
      || GameEvents.isKeyPressed('w');
    if (pressed && !this.jumpWasPressed()) {
      if (this.controller.grounded()) {
        this.controller.requestJump();
        this.jumpsUsed.set(1);
      } else if (this.hasDash() && this.jumpsUsed() < 2) {
        this.controller.body.velocityY.set(-490);
        this.controller.grounded.set(false);
        this.jumpsUsed.set(2);
      }
    }
    this.jumpWasPressed.set(pressed);
  }

  /**
   * Starts a short horizontal dash and breaks the sealed gate on contact.
   * @param deltaSeconds Duration of the frame in seconds.
   * @param viewportWidth Current viewport width.
   * @private
   * @return {void}
   */
  private updateDashInput(deltaSeconds: number, viewportWidth: number): void {
    this.dashCooldown.set(Math.max(0, this.dashCooldown() - deltaSeconds));
    this.dashRemaining.set(Math.max(0, this.dashRemaining() - deltaSeconds));
    const pressed = GameEvents.isKeyPressed('Shift') || GameEvents.isKeyPressed('x');
    if (pressed && !this.dashWasPressed() && this.hasDash() && this.dashCooldown() === 0) {
      this.dashRemaining.set(0.2);
      this.dashCooldown.set(0.85);
      this.controller.body.velocityY.set(0);
      this.message.set('MOON DASH!');
      if (Math.abs(this.controller.body.x() - viewportWidth * 1.8) < 90) {
        this.gateOpen.set(true);
        this.message.set('THE CRYSTAL SEAL SHATTERS.');
      }
    }
    this.dashWasPressed.set(pressed);
  }

  /**
   * Advances the platformer controller and applies dash velocity when active.
   * @param deltaSeconds Duration of the frame in seconds.
   * @param horizontal Horizontal input.
   * @private
   * @return {void}
   */
  private advanceController(deltaSeconds: number, horizontal: number): void {
    this.controller.update(deltaSeconds, horizontal, this.controller.grounded());
    if (this.dashRemaining() > 0) {
      this.controller.body.x.set(this.controller.body.x() + this.facing() * 500 * deltaSeconds);
      this.controller.body.velocityX.set(this.facing() * 760);
    }
  }

  /**
   * Fires bolts, advances the wisp patrol, and resolves projectile impacts.
   * @param deltaSeconds Duration of the frame in seconds.
   * @param playerWidth Player collision width.
   * @param playerHeight Player collision height.
   * @param floor Floor height.
   * @param viewportHeight Current viewport height.
   * @param scale Responsive drawing scale.
   * @private
   * @return {void}
   */
  private updateWispAndProjectiles(
    deltaSeconds: number,
    playerWidth: number,
    playerHeight: number,
    floor: number,
    viewportHeight: number,
    scale: number
  ): void {
    this.weapon.update(deltaSeconds);
    this.wisp.update(deltaSeconds);
    if (GameEvents.isKeyPressed('z') && this.weapon.tryFire()) {
      const x = this.controller.body.x() + (this.facing() > 0 ? playerWidth : 0);
      const y = this.controller.body.y() + playerHeight * 0.52;
      this.projectiles.set([...this.projectiles(), new Projectile(x, y, this.facing() * 560, 0, 1, 1.4)]);
    }
    const wispY = floor - playerHeight * 0.68 - viewportHeight * 0.015;
    const remaining = this.projectiles().filter((projectile) => {
      projectile.update(deltaSeconds);
      if (!projectile.active()) return false;
      if (!this.wisp.isAlive || !Collision2D.overlapsCircles(
        projectile.body.x(), projectile.body.y(), 7 * scale,
        this.wisp.x(), wispY, viewportHeight * 0.035
      )) return true;
      const defeated = this.wisp.takeDamage(projectile.damage());
      this.message.set(defeated ? 'THE CRYSTAL WISP FADES. THE BEACON IS OPEN.' : 'CRYSTAL BOLT HITS THE WISP.');
      return false;
    });
    this.projectiles.set(remaining);
  }

  /**
   * Requires defeating the wisp before the explorer can reach the final beacon.
   * @param playerWidth Player collision width.
   * @param worldWidth Full world width.
   * @private
   * @return {void}
   */
  private resolveExit(playerWidth: number, worldWidth: number): void {
    if (this.controller.body.x() < worldWidth - playerWidth * 1.6) return;
    if (this.wisp.isAlive) {
      this.controller.body.x.set(worldWidth - playerWidth * 2.2);
      this.controller.body.velocityX.set(0);
      this.message.set('THE CRYSTAL WISP GUARDS THE BEACON. PRESS Z TO FIRE.');
      return;
    }
    this.completed.set(true);
  }

  /**
   * Resolves the floor and all one-way platform landings in the current world.
   * @param previousY Player's previous vertical position.
   * @param playerWidth Player collision width.
   * @param playerHeight Player collision height.
   * @param floor Floor height.
   * @param viewportWidth Current viewport width.
   * @param viewportHeight Current viewport height.
   * @private
   * @return {void}
   */
  private resolvePlatforms(
    previousY: number,
    playerWidth: number,
    playerHeight: number,
    floor: number,
    viewportWidth: number,
    viewportHeight: number
  ): void {
    let grounded = false;
    const body = this.controller.body;
    if (this.hasGroundAt(body.x() + playerWidth * 0.5, viewportWidth)
      && body.y() + playerHeight >= floor && body.velocityY() >= 0) {
      body.y.set(floor - playerHeight);
      body.velocityY.set(0);
      grounded = true;
    }
    this.getPlatforms(viewportWidth, viewportHeight).forEach((platform) => {
      const landing = Collision2D.resolveOneWayPlatform(
        body.x(), body.y(), playerWidth, playerHeight, previousY, body.velocityY(), platform
      );
      if (!landing.landed) return;
      body.y.set(landing.resolvedY);
      body.velocityY.set(0);
      grounded = true;
    });
    this.controller.grounded.set(grounded);
    if (grounded) this.jumpsUsed.set(0);
  }

  /**
   * Returns the ledges and raised platforms spanning all three regions.
   * @param viewportWidth Current viewport width.
   * @param viewportHeight Current viewport height.
   * @private
   * @return {CollisionRect[]}
   */
  private getPlatforms(viewportWidth: number, viewportHeight: number): CollisionRect[] {
    const ledgeY = viewportHeight * 0.67;
    const highY = viewportHeight * 0.57;
    return [
      { x: viewportWidth * 0.28, y: ledgeY, width: viewportWidth * 0.24, height: 16 },
      { x: viewportWidth * 0.68, y: ledgeY, width: viewportWidth * 0.2, height: 16 },
      { x: viewportWidth * 0.87, y: viewportHeight * 0.73, width: viewportWidth * 0.17, height: 16 },
      { x: viewportWidth * 1.18, y: ledgeY, width: viewportWidth * 0.27, height: 16 },
      { x: viewportWidth * 1.55, y: highY, width: viewportWidth * 0.22, height: 16 },
      { x: viewportWidth * 2.08, y: ledgeY, width: viewportWidth * 0.26, height: 16 },
      { x: viewportWidth * 2.2, y: viewportHeight * 0.73, width: viewportWidth * 0.18, height: 16 },
      { x: viewportWidth * 2.48, y: highY, width: viewportWidth * 0.22, height: 16 }
    ];
  }

  /**
   * Reports whether the world floor supports a player at the supplied position.
   * @param worldX Player's horizontal world coordinate.
   * @param viewportWidth Current viewport width.
   * @private
   * @return {boolean}
   */
  private hasGroundAt(worldX: number, viewportWidth: number): boolean {
    const progress = worldX / viewportWidth;
    return !(progress >= 0.86 && progress <= 1.03)
      && !(progress >= 2.2 && progress <= 2.38);
  }

  /**
   * Blocks the crystal gate until a dash breaks it and clamps world edges.
   * @param playerWidth Player collision width.
   * @param viewportWidth Current viewport width.
   * @param viewportHeight Current viewport height.
   * @private
   * @return {void}
   */
  private resolveGate(playerWidth: number, viewportWidth: number, viewportHeight: number): void {
    const gateX = viewportWidth * 1.8;
    const gateHeight = viewportHeight * 0.49;
    const body = this.controller.body;
    if (!this.gateOpen() && body.x() + playerWidth > gateX
      && body.y() + playerWidth * 1.55 > viewportHeight * 0.82 - gateHeight) {
      body.x.set(gateX - playerWidth);
      body.velocityX.set(0);
    }
    if (body.x() < 0) body.x.set(0);
  }

  /**
   * Grants the shard ability and updates the checkpoint when the explorer reaches it.
   * @param playerWidth Player collision width.
   * @param playerHeight Player collision height.
   * @param floor Floor height.
   * @param viewportWidth Current viewport width.
   * @private
   * @return {void}
   */
  private resolvePickup(
    playerWidth: number,
    playerHeight: number,
    floor: number,
    viewportWidth: number
  ): void {
    if (this.hasDash()) return;
    const shardX = viewportWidth * 0.64;
    const shardY = floor - playerHeight * 0.5;
    if (Math.hypot(this.controller.body.x() - shardX, this.controller.body.y() - shardY) > playerWidth * 1.5) return;
    this.hasDash.set(true);
    this.checkpointX.set(viewportWidth * 0.56);
    this.message.set('MOON SHARD FOUND. DOUBLE JUMP + PRESS SHIFT OR X TO DASH.');
  }

  /**
   * Respawns the explorer at the latest checkpoint after falling out of the world.
   * @param playerHeight Player collision height.
   * @param floor Floor height.
   * @param worldWidth Full world width.
   * @private
   * @return {void}
   */
  private resolveWorldBounds(playerHeight: number, floor: number, worldWidth: number): void {
    const body = this.controller.body;
    if (body.y() <= GameContext.gameDimensionsModel.getHeight() + 180) return;
    this.hearts.set(this.hearts() - 1);
    body.setPosition(this.checkpointX(), floor - playerHeight);
    body.stop();
    this.controller.grounded.set(true);
    this.message.set('THE FALL COST A HEART. RETURN TO THE LAST SHRINE.');
    if (body.x() > worldWidth) body.x.set(worldWidth);
  }

  /**
   * Paints the night sky and parallax stars behind the level.
   * @param width Canvas width.
   * @param height Canvas height.
   * @param cameraX Camera offset.
   * @param scale Responsive drawing scale.
   * @private
   * @return {void}
   */
  private drawSky(width: number, height: number, cameraX: number, scale: number): void {
    GameContext.drawRect(0, 0, width, height, '#11172d');
    GameContext.drawRect(0, height * 0.12, width, height * 0.62, '#202b4b');
    for (let index = 0; index < 32; index++) {
      const worldX = (index * 127 + 44) % (width * ROOM_NAMES.length);
      const screenX = worldX - cameraX * 0.32;
      if (screenX < -4 || screenX > width + 4) continue;
      const starY = height * (0.13 + (index * 37 % 44) / 100);
      GameContext.drawCircle(screenX, starY, (index % 3 + 1) * scale, '#b8d7ff');
    }
  }

  /**
   * Draws the continuous ground and the visible room transition markers.
   * @param width Canvas width.
   * @param height Canvas height.
   * @param cameraX Camera offset.
   * @param floor Floor height.
   * @private
   * @return {void}
   */
  private drawTerrain(width: number, height: number, cameraX: number, floor: number): void {
    const groundSegments = [[0, 0.86], [1.03, 2.2], [2.38, ROOM_NAMES.length]];
    groundSegments.forEach(([start, end]) => {
      const x = start * width - cameraX;
      const segmentWidth = (end - start) * width;
      GameContext.drawRect(x, floor, segmentWidth, height - floor, '#202638');
      GameContext.drawRect(x, floor, segmentWidth, 8, '#63a7a0');
    });
    for (let room = 1; room < ROOM_NAMES.length; room++) {
      const x = room * width - cameraX;
      GameContext.drawRect(x, height * 0.18, 3, floor - height * 0.18, 'rgba(164, 204, 231, 0.16)');
    }
  }

  /**
   * Draws visible raised platforms and their luminous edges.
   * @param width Canvas width.
   * @param height Canvas height.
   * @param cameraX Camera offset.
   * @private
   * @return {void}
   */
  private drawPlatforms(width: number, height: number, cameraX: number): void {
    this.getPlatforms(width, height).forEach((platform) => {
      const x = platform.x - cameraX;
      if (x + platform.width < 0 || x > width) return;
      GameContext.drawRect(x, platform.y, platform.width, platform.height, '#435575');
      GameContext.drawRect(x, platform.y, platform.width, 4, '#8ce0d2');
      GameContext.drawRect(x + 8, platform.y + platform.height, platform.width - 16, 8, '#282f47');
    });
  }

  /**
   * Draws the shard in the first region until the dash ability is acquired.
   * @param width Canvas width.
   * @param height Canvas height.
   * @param cameraX Camera offset.
   * @param scale Responsive drawing scale.
   * @private
   * @return {void}
   */
  private drawMoonShard(width: number, height: number, cameraX: number, scale: number): void {
    if (this.hasDash()) return;
    const x = width * 0.64 - cameraX;
    const y = height * 0.75;
    GameContext.drawCircle(x, y, 16 * scale, 'rgba(119, 247, 232, 0.24)');
    GameContext.drawRect(x - 5 * scale, y - 12 * scale, 10 * scale, 24 * scale, '#a3fff0');
    GameContext.drawRect(x - 12 * scale, y - 5 * scale, 24 * scale, 10 * scale, '#a3fff0');
  }

  /**
   * Draws the breakable crystal seal that opens the citadel route.
   * @param width Canvas width.
   * @param height Canvas height.
   * @param cameraX Camera offset.
   * @param floor Floor height.
   * @param scale Responsive drawing scale.
   * @private
   * @return {void}
   */
  private drawGate(width: number, height: number, cameraX: number, floor: number, scale: number): void {
    if (this.gateOpen()) return;
    const gateX = width * 1.8 - cameraX;
    GameContext.drawRect(gateX, floor - height * 0.49, 20 * scale, height * 0.49, '#526c91');
    GameContext.drawRect(gateX + 5 * scale, floor - height * 0.49, 5 * scale, height * 0.49, '#a9f7ed');
    GameContext.drawRect(gateX + 12 * scale, floor - height * 0.49, 4 * scale, height * 0.49, '#a9f7ed');
  }

  /**
   * Draws the patrolling crystal wisp and its remaining health.
   * @param width Canvas width.
   * @param height Canvas height.
   * @param cameraX Camera offset.
   * @param floor Floor height.
   * @param scale Responsive drawing scale.
   * @private
   * @return {void}
   */
  private drawWisp(width: number, height: number, cameraX: number, floor: number, scale: number): void {
    if (!this.wisp.isAlive) return;
    const playerHeight = Math.max(28, height * 0.055) * 1.55;
    const x = this.wisp.x() - cameraX;
    const y = floor - playerHeight * 0.68 - height * 0.015;
    if (x < -40 || x > width + 40) return;
    GameContext.drawCircle(x, y, 25 * scale, 'rgba(142, 111, 235, 0.22)');
    GameContext.drawCircle(x, y, 17 * scale, '#a98aef');
    GameContext.drawRect(x - 12 * scale, y - 3 * scale, 7 * scale, 4 * scale, '#f2f1ff');
    GameContext.drawRect(x + 5 * scale, y - 3 * scale, 7 * scale, 4 * scale, '#f2f1ff');
    GameContext.drawRect(x - 21 * scale, y - 31 * scale, 42 * scale, 4 * scale, '#1a1930');
    GameContext.drawRect(x - 21 * scale, y - 31 * scale,
      42 * scale * this.wisp.health() / 5, 4 * scale, '#d7a4ff');
  }

  /**
   * Draws active projectile bolts in world-to-screen coordinates.
   * @param cameraX Camera offset.
   * @param scale Responsive drawing scale.
   * @private
   * @return {void}
   */
  private drawProjectiles(cameraX: number, scale: number): void {
    this.projectiles().forEach((projectile) => {
      if (!projectile.active()) return;
      GameContext.drawCircle(projectile.body.x() - cameraX, projectile.body.y(), 7 * scale, '#c5fff2');
      GameContext.drawCircle(projectile.body.x() - cameraX, projectile.body.y(), 3 * scale, '#ffffff');
    });
  }

  /**
   * Draws the explorer and the active dash trail.
   * @param width Canvas width.
   * @param height Canvas height.
   * @param cameraX Camera offset.
   * @param scale Responsive drawing scale.
   * @private
   * @return {void}
   */
  private drawExplorer(height: number, cameraX: number, scale: number): void {
    const playerWidth = Math.max(28, height * 0.055);
    const playerHeight = playerWidth * 1.55;
    const x = this.controller.body.x() - cameraX;
    const y = this.controller.body.y();
    if (this.dashRemaining() > 0) {
      GameContext.drawRect(x - this.facing() * playerWidth * 1.2, y + playerHeight * 0.4,
        playerWidth * 1.4, playerHeight * 0.22, 'rgba(124, 248, 233, 0.65)');
    }
    GameContext.drawRect(x + playerWidth * 0.18, y + playerHeight * 0.4,
      playerWidth * 0.64, playerHeight * 0.6, '#c7d6e8');
    GameContext.drawRect(x + playerWidth * 0.12, y + playerHeight * 0.08,
      playerWidth * 0.76, playerHeight * 0.4, '#6e9fba');
    GameContext.drawRect(x + (this.facing() > 0 ? playerWidth * 0.62 : playerWidth * 0.25),
      y + playerHeight * 0.22, 4 * scale, 4 * scale, '#eafff6');
  }

  /**
   * Draws the region name, health, ability, and control instructions.
   * @param width Canvas width.
   * @param height Canvas height.
   * @param cameraX Camera offset.
   * @param scale Responsive drawing scale.
   * @private
   * @return {void}
   */
  private drawHud(width: number, height: number, cameraX: number, scale: number): void {
    const roomIndex = Math.min(ROOM_NAMES.length - 1, Math.floor(this.controller.body.x() / width));
    this.drawLabel(ROOM_NAMES[roomIndex], width * 0.5, height * 0.07,
      18 * scale, '#d9e8ff', 'center', width * 0.8);
    this.drawLabel(`HEARTS  ${'◆ '.repeat(this.hearts()).trim()}    ${this.hasDash() ? 'MOON DASH READY' : 'MOON DASH LOCKED'}`,
      width * 0.5, height * 0.12, 11 * scale, '#b8f4e9', 'center', width * 0.9);
    this.drawLabel(this.message(), width * 0.5, height * 0.88,
      10 * scale, '#ffffff', 'center', width * 0.9);
    this.drawLabel('MOVE  A/D OR ARROWS     JUMP  SPACE     MOON DASH  SHIFT / X',
      width * 0.5, height * 0.93, 9 * scale, '#d6e5f7', 'center', width * 0.92);
    this.drawLabel('FIRE  Z', width * 0.5, height * 0.965, 9 * scale, '#a8c9df', 'center', width * 0.92);
    const beaconX = width * ROOM_NAMES.length - cameraX;
    GameContext.drawRect(beaconX - 12 * scale, height * 0.57, 24 * scale, height * 0.25, '#b5d8ff');
    GameContext.drawRect(beaconX - 5 * scale, height * 0.6, 10 * scale, height * 0.19, '#e8fff9');
  }

  /**
   * Draws the completion or game-over overlay.
   * @param width Canvas width.
   * @param height Canvas height.
   * @param scale Responsive drawing scale.
   * @private
   * @return {void}
   */
  private drawEnding(width: number, height: number, scale: number): void {
    GameContext.drawRect(width * 0.12, height * 0.38, width * 0.76, height * 0.2, '#10172be8');
    this.drawLabel(this.completed() ? 'THE SUNKEN CITADEL OPENS' : 'THE LIGHT GOES OUT',
      width * 0.5, height * 0.46, 19 * scale, '#eafff6', 'center', width * 0.7);
    this.drawLabel('PRESS RESTART TO RETURN TO THE GROVE', width * 0.5, height * 0.52,
      10 * scale, '#cfdaef', 'center', width * 0.7);
  }
}
