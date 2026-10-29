import { signalValue, type SignalValue } from 'reactive-values';
import {
  BaseGame,
  GameBackground,
  GameContext,
  GameInput,
  GameLoader,
  Inventory,
  MathUtils,
  QuestLog,
  Sprite,
  TouchControls,
  TurnQueue
} from '../../engine';

import { RpgCombatant } from './';

/**
 * Shared values used to configure game.
 * @constant
 */
const PARTY_SETUP = [
  { name: 'AERIN  /  KNIGHT', hp: 58, mp: 5, attack: 12, defense: 8, speed: 6, color: '#69c7ff' },
  { name: 'LYRA  /  MAGE', hp: 38, mp: 16, attack: 8, defense: 4, speed: 8, color: '#c79aff' },
  { name: 'BRAM  /  FIGHTER', hp: 52, mp: 7, attack: 11, defense: 6, speed: 5, color: '#ff9b68' },
  { name: 'SERA  /  HEALER', hp: 42, mp: 14, attack: 7, defense: 5, speed: 7, color: '#91e2a4' }
] as const;
/**
 * Shared values used to configure game.
 * @constant
 */
const ACTIONS = ['ATTACK', 'SPELL', 'POTION'] as const;
/**
 * Shared values used to configure game.
 * @constant
 */
const WORLD_COLUMNS = 20;
/**
 * Shared values used to configure game.
 * @constant
 */
const WORLD_ROWS = 12;
/**
 * Shared values used to configure game.
 * @constant
 */
const CRYSTAL_TILE = { x: 11, y: 3 };
/**
 * Shared values used to configure game.
 * @constant
 */
const DUNGEON_TILE = { x: 17, y: 8 };
/**
 * Shared values used to configure game.
 * @constant
 */
const INN_TILE = { x: 2, y: 8 };

/**
 * A compact turn-based fantasy RPG built to exercise the engine's RPG systems.
 * @class CrystalOathGame
 */
export default class extends BaseGame {
  /**
   * Scene-scoped movement and interaction controls for phones and tablets.
   * @property {TouchControls} touchControls
   * @readonly
   * @private
   */
  private readonly touchControls = new TouchControls({ primaryAction: 'interact' });

  /**
   * The four adventurers whose stats and turns are managed by the engine.
   * @property {RpgCombatant[]} party
   * @private
   * @readonly
   */
  private readonly party = PARTY_SETUP.map((hero) => new RpgCombatant(hero.name, 'party', {
    hp: hero.hp, maxHp: hero.hp, mp: hero.mp, maxMp: hero.mp,
    attack: hero.attack, defense: hero.defense, speed: hero.speed
  }));

  /**
   * The crystal guardian fought by the party.
   * @property {RpgCombatant} guardian
   * @private
   * @readonly
   */
  private readonly guardian = new RpgCombatant('THE CRYSTAL WARDEN', 'enemy', {
    hp: 170, maxHp: 170, mp: 0, maxMp: 0, attack: 13, defense: 7, speed: 4
  });

  /**
   * Animated boss sprite reused from the engine's existing enemy atlas.
   * @property {Sprite} guardianSprite
   * @private
   * @readonly
   */
  private readonly guardianSprite = new Sprite(GameLoader.getImage('boss8'), 180, 180, 0, 0, 0.5, 0.5);

  /**
   * Orders living combatants by speed and advances the active turn.
   * @property {TurnQueue<RpgCombatant>} turnQueue
   * @private
   * @readonly
   */
  private readonly turnQueue = new TurnQueue<RpgCombatant>();

  /**
   * Stores party items and consumable healing potions.
   * @property {Inventory} inventory
   * @private
   * @readonly
   */
  private readonly inventory = new Inventory(8);

  /**
   * Records the party's objective to defeat the crystal guardian.
   * @property {QuestLog} questLog
   * @private
   * @readonly
   */
  private readonly questLog = new QuestLog();

  /**
   * Current highlighted battle command.
   * @property {SignalValue<number>} actionIndex
   * @private
   * @readonly
   */
  private readonly actionIndex: SignalValue<number> = signalValue(0);

  /**
   * Battle result: active combat, party victory, or party defeat.
   * @property {SignalValue<'active' | 'victory' | 'defeat'>} result
   * @private
   * @readonly
   */
  private readonly result: SignalValue<'active' | 'victory' | 'defeat'> = signalValue<'active' | 'victory' | 'defeat'>('active');

  /**
   * Latest battle event shown in the message panel.
   * @property {SignalValue<string>} message
   * @private
   * @readonly
   */
  private readonly message: SignalValue<string> = signalValue('A CRYSTAL WARDEN BLOCKS THE PASS!');



  /**
   * Current adventure section.
   * @property {SignalValue<'overworld' | 'battle' | 'victory' | 'defeat'>} phase
   * @private
   * @readonly
   */
  private readonly phase: SignalValue<'overworld' | 'battle' | 'victory' | 'defeat'> = signalValue<'overworld' | 'battle' | 'victory' | 'defeat'>('overworld');

  /**
   * Tile coordinate of the exploring party.
   * @property {SignalValue<{ x: number; y: number }>} worldPosition
   * @private
   * @readonly
   */
  private readonly worldPosition: SignalValue<{
  /**
   * Horizontal coordinate in the owning coordinate space.
   * @property {number} x
   */
  x: number;
  /**
   * Vertical coordinate in the owning coordinate space.
   * @property {number} y
   */
  y: number }> = signalValue({ x: 3, y: 8 });

  /**
   * Whether the party has recovered the sun crystal.
   * @property {SignalValue<boolean>} hasSunCrystal
   * @private
   * @readonly
   */
  private readonly hasSunCrystal: SignalValue<boolean> = signalValue(false);

  /**
   * Delay between tile steps while directional input is held.
   * @property {SignalValue<number>} moveDelay
   * @private
   * @readonly
   */
  private readonly moveDelay: SignalValue<number> = signalValue(0);

  /**
   * Creates the party, stocks its inventory, starts the quest, and begins play.
   * @param onReturnToMenu Callback used by the shared controls to return to the selector.
   * @public
   * @return {void}
   * @constructor
   */
  public constructor(onReturnToMenu?: () => void) {
    super(onReturnToMenu);
    this.registerCleanup(() => this.touchControls.dispose());
    this.guardianSprite.playAtlasClip(GameLoader.getAtlas('boss8').getAnimation('idle-row-6'));
    this.inventory.add('potion', 2);
    this.questLog.start('crystal-oath', [1, 1]);
    this.message.set('FIND THE SUN CRYSTAL IN THE EASTERN WOODS.');
    this.setTurnOrder();
    this.start();
  }

  /**
   * Reports whether combat has ended.
   * @protected
   * @return {boolean}
   */
  protected get isGameOver(): boolean {
    return this.phase() === 'victory' || this.phase() === 'defeat';
  }

  /**
   * Reads command input while the party is active and resolves enemy turns.
   * @param deltaSeconds Duration of the frame in seconds.
   * @protected
   * @return {void}
   * @param {number} _deltaSeconds Elapsed simulation time in seconds.
   */
  protected updateGame(_deltaSeconds: number): void {
    if (this.phase() === 'overworld') {
      this.updateOverworld(_deltaSeconds);
      return;
    }
    if (this.phase() !== 'battle' || this.result() !== 'active') return;
    this.guardianSprite.update(_deltaSeconds);
    const navigationPressed = GameInput.wasPressed('moveLeft')
      || GameInput.wasPressed('moveRight');
    const movingRight = GameInput.isDown('moveRight');
    if (navigationPressed) {
      const direction = movingRight ? 1 : -1;
      this.actionIndex.set((this.actionIndex() + direction + ACTIONS.length) % ACTIONS.length);
    }

    if (GameInput.wasPressed('interact')) this.performSelectedAction();
  }

  /**
   * Renders the fantasy battlefield, party status, command menu, and battle log.
   * @protected
   * @return {void}
   */
  protected drawGame(): void {
    const width = GameContext.gameDimensionsModel.getWidth();
    const height = GameContext.gameDimensionsModel.getHeight()
      - (GameContext.isMobileDevice && !this.isGameOver ? this.touchControls.layout.reservedBottom : 0);
    const unit = Math.min(width, height);
    const scale = MathUtils.clamp(unit / 720, 0.62, 1.15);
    if (this.phase() === 'overworld') {
      this.drawOverworld(width, height, scale);
      this.drawTouchControls();
      return;
    }
    if (this.phase() === 'victory' || this.phase() === 'defeat') {
      this.touchControls.draw(false);
      this.drawAdventureEnding(width, height, scale);
      return;
    }
    this.drawBattlefield(width, height, scale);
    this.drawEnemy(width, height, scale);
    this.drawParty(width, height, scale);
    this.drawCommandPanel(width, height, scale);
    this.drawResult(width, height, scale);
    this.drawTouchControls();
  }

  /**
   * Shows the shared action as interact in the world and confirm in combat.
   * @returns {void}
   * @private
   */
  private drawTouchControls(): void {
    this.touchControls.draw();
    if (!GameContext.isMobileDevice) return;
    const { shoot } = this.touchControls.layout;
    const fontSize = Math.max(9, shoot.radius * 0.32);
    this.drawLabel(this.phase() === 'overworld' ? 'INTERACT' : 'CONFIRM',
      shoot.x, shoot.y + shoot.radius + fontSize, fontSize, '#ffffff', 'center');
  }

  /**
   * Restores the party, guardian, inventory, quest, and battle turn order.
   * @protected
   * @return {void}
   */
  protected restartGame(): void {
    PARTY_SETUP.forEach((hero, index) => this.restoreCombatant(this.party[index], {
      hp: hero.hp, maxHp: hero.hp, mp: hero.mp, maxMp: hero.mp,
      attack: hero.attack, defense: hero.defense, speed: hero.speed
    }));
    this.restoreCombatant(this.guardian, {
      hp: 170, maxHp: 170, mp: 0, maxMp: 0, attack: 13, defense: 7, speed: 4
    });
    this.inventory.clear();
    this.inventory.add('potion', 2);
    this.questLog.abandon('crystal-oath');
    this.questLog.start('crystal-oath', [1, 1]);
    this.worldPosition.set({ x: 3, y: 8 });
    this.hasSunCrystal.set(false);
    this.moveDelay.set(0);
    this.phase.set('overworld');
    this.result.set('active');
    this.message.set('FIND THE SUN CRYSTAL IN THE EASTERN WOODS.');
    this.actionIndex.set(0);
    this.setTurnOrder();
  }

  /**
   * Moves the party around the world map and handles single-press interactions.
   * @param deltaSeconds Duration of the frame in seconds.
   * @private
   * @return {void}
   */
  private updateOverworld(deltaSeconds: number): void {
    this.moveDelay.set(Math.max(0, this.moveDelay() - deltaSeconds));
    if (this.moveDelay() === 0) this.movePartyOneTile();
    if (GameInput.wasPressed('interact')) this.interactWithLandmark();
  }

  /**
   * Moves one tile in the pressed direction when the destination is walkable.
   * @private
   * @return {void}
   */
  private movePartyOneTile(): void {
    const dx = Number(GameInput.isDown('moveRight'))
      - Number(GameInput.isDown('moveLeft'));
    const dy = Number(GameInput.isDown('moveDown'))
      - Number(GameInput.isDown('moveUp'));
    if (dx === 0 && dy === 0) return;
    const current = this.worldPosition();
    const next = { x: current.x + dx, y: current.y + dy };
    if (this.isWorldBlocked(next.x, next.y)) return;
    this.worldPosition.set(next);
    this.moveDelay.set(0.15);
  }

  /**
   * Handles the crystal, village inn, and dungeon entrance.
   * @private
   * @return {void}
   */
  private interactWithLandmark(): void {
    const { x, y } = this.worldPosition();
    if (x === CRYSTAL_TILE.x && y === CRYSTAL_TILE.y && !this.hasSunCrystal()) {
      this.hasSunCrystal.set(true);
      this.questLog.advance('crystal-oath', 0);
      this.inventory.add('sun-crystal', 1);
      this.message.set('THE SUN CRYSTAL GLOWS. THE DUNGEON SEAL IS BROKEN.');
      return;
    }
    if (x === INN_TILE.x && y === INN_TILE.y) {
      this.party.forEach((hero) => {
        hero.stats.set('hp', hero.stats.get('maxHp'));
        hero.stats.set('mp', hero.stats.get('maxMp'));
      });
      this.message.set('THE VILLAGE INN RESTORES THE PARTY.');
      return;
    }
    if (x === DUNGEON_TILE.x && y === DUNGEON_TILE.y) {
      if (!this.hasSunCrystal()) {
        this.message.set('THE DUNGEON SEAL NEEDS THE SUN CRYSTAL.');
        return;
      }
      this.phase.set('battle');
      this.result.set('active');
      this.message.set('THE CRYSTAL WARDEN BLOCKS THE PASS!');
      return;
    }
    this.message.set('THE OLD ROAD LEADS EAST TO THE SEALED DUNGEON.');
  }

  /**
   * Draws the explorable overworld and its three story landmarks.
   * @param width Canvas width.
   * @param height Canvas height.
   * @param scale Responsive drawing scale.
   * @private
   * @return {void}
   */
  private drawOverworld(width: number, height: number, scale: number): void {
    GameContext.clear();
    GameBackground.draw(
      GameLoader.getImage('background1080x1920'),
      GameLoader.getImage('background1920x1080'),
      'rgba(17, 35, 42, 0.62)'
    );
    const tile = Math.min((width - 28) / WORLD_COLUMNS, (height * 0.68) / WORLD_ROWS);
    const mapWidth = tile * WORLD_COLUMNS;
    const mapHeight = tile * WORLD_ROWS;
    const originX = (width - mapWidth) * 0.5;
    const originY = height * 0.12;
    for (let row = 0; row < WORLD_ROWS; row++) {
      for (let column = 0; column < WORLD_COLUMNS; column++) {
        const blocked = this.isWorldBlocked(column, row);
        const color = blocked ? '#276278' : ((column + row) % 2 === 0 ? '#4b8052' : '#46784c');
        GameContext.drawRect(originX + column * tile, originY + row * tile, tile - 1, tile - 1, color);
      }
    }
    this.drawLandmark(originX, originY, tile, INN_TILE.x, INN_TILE.y, '#f4c66d', 'I');
    this.drawLandmark(originX, originY, tile, CRYSTAL_TILE.x, CRYSTAL_TILE.y,
      this.hasSunCrystal() ? '#756b75' : '#87f5ed', this.hasSunCrystal() ? '·' : '✦');
    this.drawLandmark(originX, originY, tile, DUNGEON_TILE.x, DUNGEON_TILE.y, '#a59acc', 'D');
    const player = this.worldPosition();
    const playerX = originX + (player.x + 0.5) * tile;
    const playerY = originY + (player.y + 0.5) * tile;
    GameContext.drawCircle(playerX, playerY, tile * 0.31, '#f5e7ca');
    GameContext.drawRect(playerX - tile * 0.18, playerY - tile * 0.2, tile * 0.36, tile * 0.4, '#56b9dd');
    this.drawLabel('THE SUNWARD MARCH', width * 0.5, height * 0.065,
      20 * scale, '#f0e7c4', 'center', width * 0.86);
    const questStep = this.hasSunCrystal() ? 'ENTER THE SEALED DUNGEON' : 'FIND THE SUN CRYSTAL';
    this.drawLabel(`QUEST  ${questStep}`, width * 0.5, originY + mapHeight + 25 * scale,
      12 * scale, '#d9f1e2', 'center', width * 0.92);
    const instructions = GameContext.isMobileDevice
      ? 'TOUCH ARROWS TO MOVE   •   INTERACT   •   INN RESTORES HP/MP'
      : 'ARROWS/WASD MOVE   •   ENTER INTERACT   •   INN RESTORES HP/MP';
    this.drawLabel(`${this.message()}   •   ${instructions}`,
      width * 0.5, height * 0.91, 10 * scale, '#ffffff', 'center', width * 0.94);
  }

  /**
   * Draws a labeled landmark tile on the overworld.
   * @param originX Map origin on the horizontal axis.
   * @param originY Map origin on the vertical axis.
   * @param tile Tile size in pixels.
   * @param column Landmark column.
   * @param row Landmark row.
   * @param color Landmark color.
   * @param label Landmark character.
   * @private
   * @return {void}
   */
  private drawLandmark(
    originX: number,
    originY: number,
    tile: number,
    column: number,
    row: number,
    color: string,
    label: string
  ): void {
    const x = originX + column * tile;
    const y = originY + row * tile;
    GameContext.drawRect(x + tile * 0.13, y + tile * 0.13, tile * 0.74, tile * 0.74, color);
    this.drawLabel(label, x + tile * 0.5, y + tile * 0.69, tile * 0.6, '#182437', 'center', tile * 0.8);
  }

  /**
   * Reports whether a world coordinate is outside the map or inside the lake.
   * @param column Tile column.
   * @param row Tile row.
   * @private
   * @return {boolean}
   */
  private isWorldBlocked(column: number, row: number): boolean {
    if (column < 0 || row < 0 || column >= WORLD_COLUMNS || row >= WORLD_ROWS) return true;
    return column >= 6 && column <= 8 && row >= 2 && row <= 5;
  }

  /**
   * Draws the conclusion reached after defeating the guardian or losing the party.
   * @param width Canvas width.
   * @param height Canvas height.
   * @param scale Responsive drawing scale.
   * @private
   * @return {void}
   */
  private drawAdventureEnding(width: number, height: number, scale: number): void {
    GameContext.clear();
    GameBackground.draw(
      GameLoader.getImage('background1080x1920'),
      GameLoader.getImage('background1920x1080'),
      'rgba(16, 24, 40, 0.58)'
    );
    this.drawLabel(this.phase() === 'victory' ? 'THE SUNWARD MARCH IS SAVED' : 'THE PARTY HAS FALLEN',
      width * 0.5, height * 0.42, 24 * scale, '#dff8ed', 'center', width * 0.9);
    this.drawLabel(this.phase() === 'victory' ? 'THE CRYSTAL OATH IS FULFILLED' : 'RETURN TO THE VILLAGE AND TRY AGAIN',
      width * 0.5, height * 0.49, 13 * scale, '#c2d5e8', 'center', width * 0.9);
    this.drawLabel('USE RESTART TO BEGIN A NEW ADVENTURE', width * 0.5, height * 0.58,
      11 * scale, '#ffffff', 'center', width * 0.9);
  }

  /**
   * Paints the layered sky, distant mountains, and crystal-lit ground.
   * @param width Canvas width.
   * @param height Canvas height.
   * @param scale Responsive drawing scale.
   * @private
   * @return {void}
   */
  private drawBattlefield(width: number, height: number, scale: number): void {
    GameContext.clear();
    GameBackground.draw(
      GameLoader.getImage('background1080x1920'),
      GameLoader.getImage('background1920x1080'),
      'rgba(12, 17, 34, 0.46)'
    );
    this.drawMountain(width * 0.2, height * 0.54, 0.24, 'rgba(57, 75, 104, 0.46)');
    this.drawMountain(width * 0.53, height * 0.53, 0.32, 'rgba(52, 67, 93, 0.46)');
    GameContext.drawRect(0, height * 0.81, width, height * 0.19, 'rgba(15, 22, 36, 0.72)');
    this.drawLabel('CRYSTAL OATH', width * 0.5, height * 0.075,
      21 * scale, '#c4f7ff', 'center', width * 0.8);
  }

  /**
   * Draws one angular mountain silhouette in the battlefield background.
   * @param centerX Horizontal center of the silhouette.
   * @param baseY Ground position of the silhouette.
   * @param mountainWidth Width relative to the canvas.
   * @param color Fill color.
   * @private
   * @return {void}
   */
  private drawMountain(centerX: number, baseY: number, mountainWidth: number, color: string): void {
    const width = GameContext.gameDimensionsModel.getWidth() * mountainWidth;
    GameContext.drawRect(centerX - width * 0.5, baseY - width * 0.45, width, width * 0.45, color);
    GameContext.drawRect(centerX - width * 0.3, baseY - width * 0.66, width * 0.6, width * 0.22, color);
    GameContext.drawRect(centerX - width * 0.12, baseY - width * 0.78, width * 0.24, width * 0.14, color);
  }

  /**
   * Draws the guardian and its reactive health bar.
   * @param width Canvas width.
   * @param height Canvas height.
   * @param scale Responsive drawing scale.
   * @private
   * @return {void}
   */
  private drawEnemy(width: number, height: number, scale: number): void {
    const x = width * 0.72;
    const y = height * 0.47;
    const size = 74 * scale;
    const hp = this.guardian.stats.get('hp');
    this.guardianSprite.dimensions.setSize(size * 1.25, size * 1.25);
    this.guardianSprite.dimensions.setPosition(x, y - size * 0.38);
    this.guardianSprite.draw();
    this.drawHealthBar(x, y + 12 * scale, 120 * scale, hp / this.guardian.stats.get('maxHp'), '#7ce9dd');
    this.drawLabel(this.guardian.name, x, y + 34 * scale, 12 * scale, '#e4f7ff', 'center', width * 0.46);
  }

  /**
   * Draws the four party portraits and their health and magic status.
   * @param width Canvas width.
   * @param height Canvas height.
   * @param scale Responsive drawing scale.
   * @private
   * @return {void}
   */
  private drawParty(width: number, height: number, scale: number): void {
    const cardWidth = Math.min(width * 0.43, 230 * scale);
    const cardHeight = Math.max(43 * scale, Math.min(height * 0.105, 68 * scale));
    this.party.forEach((hero, index) => {
      const x = width * 0.06;
      const y = height * 0.59 + index * (cardHeight + 7 * scale);
      const current = this.turnQueue.getActive() === hero && this.result() === 'active';
      GameContext.drawRect(x, y, cardWidth, cardHeight, current ? '#384d70' : '#222d46');
      GameContext.drawRect(x, y, 4 * scale, cardHeight, this.heroColor(index));
      this.drawLabel(hero.name, x + 12 * scale, y + 18 * scale,
        10 * scale, hero.isAlive ? '#f4f6ff' : '#8990a1', 'left', cardWidth - 20 * scale);
      this.drawLabel(`HP ${hero.stats.get('hp')} / ${hero.stats.get('maxHp')}    MP ${hero.stats.get('mp')}`,
        x + 12 * scale, y + 38 * scale, 10 * scale, '#d4e0f4', 'left', cardWidth - 20 * scale);
      this.drawHealthBar(x + cardWidth * 0.55, y + cardHeight - 8 * scale,
        cardWidth * 0.36, hero.stats.get('hp') / hero.stats.get('maxHp'), this.heroColor(index));
    });
  }

  /**
   * Draws battle commands, potion count, and the latest action message.
   * @param width Canvas width.
   * @param height Canvas height.
   * @param scale Responsive drawing scale.
   * @private
   * @return {void}
   */
  private drawCommandPanel(width: number, height: number, scale: number): void {
    const x = width * 0.53;
    const y = height * 0.66;
    const panelWidth = width * 0.41;
    GameContext.drawRect(x, y, panelWidth, height * 0.26, '#111a2d');
    GameContext.drawRect(x + 3, y + 3, panelWidth - 6, height * 0.26 - 6, '#202e47');
    this.drawLabel(this.message(), x + panelWidth * 0.5, y + 25 * scale,
      11 * scale, '#f6e9b8', 'center', panelWidth - 22 * scale);
    const gap = panelWidth / ACTIONS.length;
    ACTIONS.forEach((action, index) => {
      const actionX = x + gap * (index + 0.5);
      const selected = this.actionIndex() === index;
      GameContext.drawRect(actionX - gap * 0.44, y + height * 0.115, gap * 0.88, 34 * scale,
        selected ? '#527fa4' : '#303b52');
      this.drawLabel(action, actionX, y + height * 0.115 + 22 * scale,
        10 * scale, '#ffffff', 'center', gap * 0.8);
    });
    const confirm = GameContext.isMobileDevice ? 'TAP CONFIRM' : 'ENTER CONFIRM';
    this.drawLabel(`POTIONS  ${this.inventory.count('potion')}     ← → SELECT   ${confirm}`,
      x + panelWidth * 0.5, y + height * 0.225,
      9 * scale, '#bfcee4', 'center', panelWidth - 14 * scale);
  }

  /**
   * Draws the victory or defeat banner after battle resolves.
   * @param width Canvas width.
   * @param height Canvas height.
   * @param scale Responsive drawing scale.
   * @private
   * @return {void}
   */
  private drawResult(width: number, height: number, scale: number): void {
    if (this.result() === 'active') return;
    const victory = this.result() === 'victory';
    GameContext.drawRect(width * 0.16, height * 0.37, width * 0.68, height * 0.19, '#10182a');
    this.drawLabel(victory ? 'THE PASS IS FREE!' : 'THE PARTY HAS FALLEN', width * 0.5, height * 0.44,
      20 * scale, victory ? '#baf7d0' : '#ff9eaa', 'center', width * 0.62);
    this.drawLabel('PRESS RESTART TO BATTLE AGAIN', width * 0.5, height * 0.5,
      10 * scale, '#d6e0f3', 'center', width * 0.62);
  }

  /**
   * Resolves the highlighted command for the active party member.
   * @private
   * @return {void}
   */
  private performSelectedAction(): void {
    const actor = this.turnQueue.getActive();
    if (!actor || actor.side !== 'party') return;
    const action = ACTIONS[this.actionIndex()];
    if (action === 'ATTACK') this.attack(actor, this.guardian, 1, 'strikes');
    if (action === 'SPELL' && !this.castSpell(actor)) return;
    if (action === 'POTION' && !this.usePotion(actor)) return;
    if (!this.guardian.isAlive) {
      this.finishBattle('victory');
      return;
    }
    this.advanceTurn();
  }

  /**
   * Spends magic and strikes the guardian with an empowered attack.
   * @param actor Party member casting the spell.
   * @private
   * @return {void}
   */
  private castSpell(actor: RpgCombatant): boolean {
    const cost = 4;
    if (actor.stats.get('mp') < cost) {
      this.message.set(`${actor.name.split('  ')[0]} HAS NOT ENOUGH MP.`);
      return false;
    }
    actor.stats.add('mp', -cost);
    this.attack(actor, this.guardian, 1.8, 'casts a crystal flare at');
    return true;
  }

  /**
   * Consumes a potion to restore health to the active party member.
   * @param actor Party member using the item.
   * @private
   * @return {void}
   */
  private usePotion(actor: RpgCombatant): boolean {
    if (actor.stats.get('hp') >= actor.stats.get('maxHp')) {
      this.message.set(`${actor.name.split('  ')[0]} IS ALREADY AT FULL HEALTH.`);
      return false;
    }
    if (!this.inventory.remove('potion')) {
      this.message.set('THE PARTY HAS NO POTIONS LEFT.');
      return false;
    }
    const restored = Math.min(24, actor.stats.get('maxHp') - actor.stats.get('hp'));
    actor.stats.add('hp', restored);
    this.message.set(`${actor.name.split('  ')[0]} USES A POTION  +${restored} HP.`);
    return true;
  }

  /**
   * Applies attack and defense stats and records the resulting damage.
   * @param actor Attacking combatant.
   * @param target Receiving combatant.
   * @param multiplier Attack strength multiplier.
   * @param verb Text describing the attack.
   * @private
   * @return {void}
   */
  private attack(actor: RpgCombatant, target: RpgCombatant, multiplier: number, verb: string): void {
    const damage = Math.max(1, Math.round(actor.stats.get('attack') * multiplier - target.stats.get('defense') * 0.45));
    target.stats.add('hp', -Math.min(damage, target.stats.get('hp')));
    this.message.set(`${actor.name.split('  ')[0]} ${verb} THE WARDEN  ${damage} DAMAGE.`);
  }

  /**
   * Advances to the next party member and resolves the guardian's turn in order.
   * @private
   * @return {void}
   */
  private advanceTurn(): void {
    this.turnQueue.advance();
    while (this.turnQueue.getActive() === this.guardian && this.result() === 'active') {
      const targets = this.party.filter((hero) => hero.isAlive);
      if (targets.length === 0) {
        this.finishBattle('defeat');
        return;
      }
      const target = targets[Math.floor(Math.random() * targets.length)];
      const damage = Math.max(1, this.guardian.stats.get('attack') - target.stats.get('defense') * 0.55);
      target.stats.add('hp', -Math.min(damage, target.stats.get('hp')));
      this.message.set(`THE WARDEN HITS ${target.name.split('  ')[0]}  ${damage} DAMAGE.`);
      if (!target.isAlive) this.turnQueue.remove(target);
      if (this.party.every((hero) => !hero.isAlive)) {
        this.finishBattle('defeat');
        return;
      }
      this.turnQueue.advance();
    }
  }

  /**
   * Updates the battle result and completes the tracked quest on victory.
   * @param result Final battle state.
   * @private
   * @return {void}
   */
  private finishBattle(result: 'victory' | 'defeat'): void {
    this.result.set(result);
    if (result === 'victory') {
      this.questLog.advance('crystal-oath', 1);
      this.phase.set('victory');
      this.message.set('THE CRYSTAL WARDEN IS DEFEATED!');
    } else {
      this.phase.set('defeat');
      this.message.set('THE PARTY MUST REGROUP.');
    }
  }

  /**
   * Rebuilds the turn queue from living characters, ordered by speed.
   * @private
   * @return {void}
   */
  private setTurnOrder(): void {
    const combatants = [...this.party, this.guardian]
      .filter((combatant) => combatant.isAlive)
      .sort((first, second) => second.stats.get('speed') - first.stats.get('speed'));
    this.turnQueue.setOrder(combatants);
  }

  /**
   * Restores all named stats on a combatant from a fresh starting record.
   * @param combatant Character whose stats are restored.
   * @param stats Starting attribute values.
   * @private
   * @return {void}
   */
  private restoreCombatant(combatant: RpgCombatant, stats: Readonly<Record<string, number>>): void {
    Object.entries(stats).forEach(([name, value]) => combatant.stats.set(name, value));
  }

  /**
   * Draws a compact health meter with a dark track and colored fill.
   * @param centerX Horizontal center.
   * @param y Vertical center.
   * @param width Meter width.
   * @param ratio Filled fraction.
   * @param color Fill color.
   * @private
   * @return {void}
   */
  private drawHealthBar(centerX: number, y: number, width: number, ratio: number, color: string): void {
    GameContext.drawRect(centerX - width * 0.5, y, width, 4, '#0c1220');
    GameContext.drawRect(centerX - width * 0.5, y, width * MathUtils.clamp(ratio, 0, 1), 4, color);
  }

  /**
   * Returns the fixed class color assigned to a party member.
   * @param index Party member index.
   * @private
   * @return {string}
   */
  private heroColor(index: number): string {
    return PARTY_SETUP[index].color;
  }
}
