import { signalValue } from 'reactive-values';
import {
  Button,
  Container,
  GameBackground,
  GameContext,
  GameControls,
  GameInput,
  GameLoader,
  Label,
  MathUtils,
  SceneManager,
  type GameScene,
  type SceneLoadContext,
  Texture
} from '../engine';

// import { MusketeersSlotGame } from './musketeers-slot';
import { MeadowQuestGame } from './meadow-quest';
import { ScratchCardGame } from './scratch-card';
import { PolarityVanguardGame } from './polarity-vanguard';
import { PachinkoGame } from './pachinko';
import { PinballGame } from './pinball';
import { ShootEmAllGame } from './shoot-em-all';
import { Game as SpaceHuntersGame } from './space-hunters';
import { SlotMachineGame } from './slot-machine';
import { SpacePatternsGame } from './space-patterns';
import { TankFrontierGame } from './tank-frontier';
import { CrystalOathGame } from './crystal-oath';
import { MoonfallGame } from './moonfall';

import type { GameChoice } from './interfaces';

/**
 * Presents the game list and starts the selected game.
 * @class GameSelector
 */
export default class implements GameScene {
  /**
   * Stores the choices state.
   * @property {GameChoice[]} choices
   * @private
   * @readonly
   */
  private readonly choices: GameChoice[] = [
    {
      title: 'SPACE HUNTERS',
      description: 'INSPIRED BY SPACE INVADERS',
      start: (onReturnToMenu) => new SpaceHuntersGame(onReturnToMenu)
    },
    {
      title: 'POLARITY VANGUARD',
      description: 'INSPIRED BY IKARUGA',
      start: (onReturnToMenu) => new PolarityVanguardGame(onReturnToMenu)
    },
    {
      title: 'SPACE PATTERNS',
      description: 'INSPIRED BY CANDY CRUSH',
      start: (onReturnToMenu) => new SpacePatternsGame(onReturnToMenu)
    },
    {
      title: 'TANK FRONTIER',
      description: 'INSPIRED BY BATTLE CITY',
      start: (onReturnToMenu) => new TankFrontierGame(onReturnToMenu)
    },
    {
      title: 'COSMIC JACKPOT',
      description: 'THREE-REEL SLOT MACHINE',
      start: (onReturnToMenu) => new SlotMachineGame(onReturnToMenu)
    },
    /*
    {
      title: 'THE THREE MUSKETEERS',
      description: 'FIVE-REEL ADVENTURE SLOT',
      start: (onReturnToMenu) => new MusketeersSlotGame(onReturnToMenu)
    },
    */
    {
      title: 'SHOOT ’EM ALL',
      description: 'SURVIVE THE INVASION',
      start: (onReturnToMenu) => new ShootEmAllGame(onReturnToMenu)
    },
    {
      title: 'LUCKY SCRATCH',
      description: 'SCRATCH THE CARD AND MATCH 3',
      start: (onReturnToMenu) => new ScratchCardGame(onReturnToMenu)
    },
    {
      title: 'PACHINKO KENO',
      description: 'DROP THE BALL, HIT THE MULTIPLIERS',
      start: (onReturnToMenu) => new PachinkoGame(onReturnToMenu)
    },
    {
      title: 'PINBALL',
      description: 'FLIP, BUMP, AND KEEP THE BALL ALIVE',
      start: (onReturnToMenu) => new PinballGame(onReturnToMenu)
    },
    {
      title: 'MEADOW QUEST',
      description: 'AN ORIGINAL SIDE-SCROLLING PLATFORM ADVENTURE',
      start: (onReturnToMenu) => new MeadowQuestGame(onReturnToMenu)
    },
    {
      title: 'CRYSTAL OATH',
      description: 'EXPLORE, FIND THE SUN CRYSTAL, DEFEAT THE WARDEN',
      start: (onReturnToMenu) => new CrystalOathGame(onReturnToMenu)
    },
    {
      title: 'MOONFALL',
      description: 'A METROIDVANIA THROUGH A SUNKEN CITADEL',
      start: (onReturnToMenu) => new MoonfallGame(onReturnToMenu)
    }
  ];
  /**
   * Choices container configuration or state owned by GameSelector.
   * @property {Container} choicesContainer
   * @readonly
   * @private
   */
  private readonly choicesContainer = new Container({ width: 0, height: 0, clipChildren: true, scrollable: true });
  /**
   * Choice buttons configuration or state owned by GameSelector.
   * @property {Button[]} choiceButtons
   * @private
   */
  private choiceButtons: Button[] = [];
  /**
   * Title label configuration or state owned by GameSelector.
   * @property {Label} titleLabel
   * @readonly
   * @private
   */
  private readonly titleLabel = new Label('ARCADE FRONTIER', { align: 'center', baseline: 'middle', color: '#ffffff' });
  /**
   * Subtitle label configuration or state owned by GameSelector.
   * @property {Label} subtitleLabel
   * @readonly
   * @private
   */
  private readonly subtitleLabel = new Label('SELECT A MISSION', { align: 'center', baseline: 'middle', color: '#b6c5ff' });
  /**
   * Choice title labels configuration or state owned by GameSelector.
   * @property {Label[]} choiceTitleLabels
   * @readonly
   * @private
   */
  private readonly choiceTitleLabels = this.choices.map((choice) => new Label(choice.title, { align: 'center', baseline: 'middle' }));
  /**
   * Choice description labels configuration or state owned by GameSelector.
   * @property {Label[]} choiceDescriptionLabels
   * @readonly
   * @private
   */
  private readonly choiceDescriptionLabels = this.choices.map((choice) => new Label(choice.description, { align: 'center', baseline: 'middle', color: '#ffffff' }));
  /**
   * Stores the selected index state.
   * @property {number} selectedIndex
   * @private
   */
  private readonly selectedIndexState = signalValue(0);
  /**
   * Reactive selection needs visibility state owned by GameSelector.
   * @property {SignalValue<boolean> & (() => boolean)} selectionNeedsVisibility
   * @readonly
   * @private
   */
  private readonly selectionNeedsVisibility = signalValue(true);
  /**
   * Returns selected index from the current GameSelector state.
   * @returns {number} selected index from the current GameSelector state.
   * @private
   */
  private get selectedIndex(): number { return this.selectedIndexState(); }
  /**
   * Updates selected index in the GameSelector state.
   * @param {number} value Value to read, validate, format, or assign.
   * @returns {void}
   * @private
   */
  private set selectedIndex(value: number) { this.selectedIndexState.set(value); }
  /**
   * Stores the started state.
   * @property {boolean} started
   * @private
   */
  private readonly startedState = signalValue(false);
  /**
   * Returns started from the current GameSelector state.
   * @returns {boolean} started from the current GameSelector state.
   * @private
   */
  private get started(): boolean { return this.startedState(); }
  /**
   * Updates started in the GameSelector state.
   * @param {boolean} value Value to read, validate, format, or assign.
   * @returns {void}
   * @private
   */
  private set started(value: boolean) { this.startedState.set(value); }
  /**
   * Stores the last frame time state.
   * @property {number} lastFrameTime
   * @private
   */
  private lastFrameTime = performance.now();
  /**
   * Stores the controls state.
   * @property {GameControls} controls
   * @private
   */
  private readonly controls: GameControls;
  /**
   * Scheduled selector frame cancelled before another scene becomes active.
   * @property {SignalValue<number | undefined>} frameId
   * @private
   */
  private readonly frameId = signalValue<number | undefined>(undefined);

  /**
   * Creates the selector, installs its controls, and starts its render loop.
   * @public
   * @return {void}
   * @constructor
   */
  public constructor() {
    GameInput.loadPreferences();
    GameInput.activateContext('menu');
    this.controls = new GameControls(() => {});
    this.createChoiceButtons();
    for (const choice of this.choices) {
      const id = `game:${choice.title}`;
      if (!SceneManager.has(id)) {
        SceneManager.register(id, () => choice.start(() => { void SceneManager.goTo('menu'); }));
      }
    }
  }

  /**
   * Loads shared engine assets before the selector begins drawing.
   * @param {SceneLoadContext} context Preparation scope reporting loader completion.
   * @returns {Promise<void>} Completion of shared asset loading.
   */
  public async load(context: SceneLoadContext): Promise<void> {
    context.reportProgress(0);
    await GameLoader.loadAll();
    context.reportProgress(1);
  }

  /**
   * Activates menu input and starts exactly one selector loop.
   * @returns {void}
   */
  public resume(): void {
    if (!this.started && this.frameId() !== undefined) return;
    GameInput.activateContext('menu');
    this.started = false;
    this.lastFrameTime = performance.now();
    this.gameLoop();
  }

  /**
   * Suspends selector interaction and cancels its pending animation frame.
   * @returns {void}
   */
  public pause(): void {
    this.started = true;
    if (this.frameId() !== undefined) cancelAnimationFrame(this.frameId()!);
    this.frameId.set(undefined);
  }

  /**
   * Releases selector buttons and container subscriptions before another scene enters.
   * @returns {void}
   */
  public dispose(): void {
    this.pause();
    this.choiceButtons.forEach(button => button.destroy());
    this.choiceButtons = [];
    this.choicesContainer.clear();
    this.choicesContainer.destroy();
    this.controls.dispose();
  }

  /**
   * Runs one selector update/draw cycle and schedules the next frame.
   * @property {(time?: number) => void} gameLoop
   * @private
   */
  private gameLoop = (time = performance.now()): void => {
    if (this.started) return;

    const deltaSeconds = MathUtils.clamp((time - this.lastFrameTime) / 1000, 0, 0.05);
    this.lastFrameTime = time;
    GameInput.update();
    this.update(deltaSeconds);
    if (this.started) return;
    this.draw();
    this.frameId.set(requestAnimationFrame(this.gameLoop));
  };

  /**
   * Updates mission selection from keyboard input.
   * @private
   * @return {void}
   * @param {number} deltaSeconds Elapsed simulation time in seconds.
   */
  private update(deltaSeconds: number): void {
    this.choicesContainer.update(deltaSeconds);
    const directionPressed = (
      GameInput.wasPressed('moveUp')
      || GameInput.wasPressed('moveDown')
    );

    if (directionPressed) {
      const direction = GameInput.isDown('moveUp') ? -1 : 1;
      this.selectedIndex = (this.selectedIndex + direction + this.choices.length) % this.choices.length;
      this.selectionNeedsVisibility.set(true);
    }


    if (GameInput.wasPressed('confirm')) {
      this.startSelectedGame();
    }
  }

  /**
   * Draws the selector background, title, choices, and shared controls.
   * @private
   * @return {void}
   */
  private draw(): void {
    const dimensions = GameContext.gameDimensionsModel;
    GameContext.clear();
    GameBackground.draw(
      GameLoader.getImage('background1080x1920'),
      GameLoader.getImage('background1920x1080'),
      'rgba(18, 18, 34, 0.76)'
    );
    this.layoutLabel(this.titleLabel, dimensions.getWidth() * 0.5, dimensions.getHeight() * 0.12,
      dimensions.getWidth() * 0.88, 48, MathUtils.clamp(GameContext.viewportUnit() * 0.055, 20, 38));
    this.titleLabel.draw();
    this.controls.drawFullscreenOnly();
    this.layoutLabel(this.subtitleLabel, dimensions.getWidth() * 0.5, dimensions.getHeight() * 0.19,
      dimensions.getWidth() * 0.85, 24, Math.max(12, Math.min(GameContext.viewportUnit() * 0.024, 16)));
    this.subtitleLabel.draw();

    const listWidth = this.getChoiceWidth();
    const scrollGutter = 14;
    const listViewportTop = dimensions.getHeight() * 0.23;
    const listViewportHeight = dimensions.getHeight() * 0.68;
    this.choicesContainer.dimensions.setPosition(
      Math.max(0, (dimensions.getWidth() - listWidth) * 0.5),
      listViewportTop
    );
    this.choicesContainer.dimensions.setSize(listWidth + scrollGutter, listViewportHeight);
    if (this.selectionNeedsVisibility()) {
      const selectedY = this.getChoiceY(this.selectedIndex);
      const cardHeight = this.getChoiceHeight();
      let scrollY = this.choicesContainer.scrollY();
      if (selectedY - cardHeight * 0.5 - scrollY < 0) {
        scrollY = selectedY - cardHeight * 0.5;
      } else if (selectedY + cardHeight * 0.5 - scrollY > listViewportHeight) {
        scrollY = selectedY + cardHeight * 0.5 - listViewportHeight;
      }
      this.choicesContainer.setScrollY(scrollY);
      this.selectionNeedsVisibility.set(false);
    }
    this.choicesContainer.draw();
  }

  /**
   * Calculates a choice card height for the current viewport.
   * @private
   * @return {number}
   */
  private getChoiceHeight(): number {
    const dimensions = GameContext.gameDimensionsModel;
    const availableHeight = dimensions.getHeight() * 0.56;
    return Math.max(34, Math.min(availableHeight / 6.5, 54));
  }

  /**
   * Returns choice width for GameSelector.
   * @returns {number} choice width for GameSelector.
   * @private
   */
  private getChoiceWidth(): number {
    const dimensions = GameContext.gameDimensionsModel;
    return Math.min(460, dimensions.getWidth() * 0.8);
  }

  /**
   * Returns the vertical center of a mission card.
   * @private
   * @return {number}
   * @param {number} index Index identifying the item within its collection.
   */
  private getChoiceY(index: number): number {
    const choiceHeight = this.getChoiceHeight();
    const gap = Math.max(6, Math.min(choiceHeight * 0.2, 12));
    return choiceHeight * 0.5 + index * (choiceHeight + gap);
  }

  /**
   * Draws one mission card with a selected or idle style.
   * @private
   * @return {void}
   * @param {string} title The title supplied to this operation.
   * @param {string} description The description supplied to this operation.
   * @param {number} y Vertical coordinate in the owning coordinate space.
   * @param {boolean} selected The selected supplied to this operation.
   * @param {number} index Index identifying the item within its collection.
   */
  private drawChoice(
    title: string,
    description: string,
    y: number,
    selected: boolean,
    index: number
  ): void {
    const width = this.getChoiceWidth();
    const centerX = width * 0.5;
    const x = 0;
    const height = this.getChoiceHeight();
    const color = selected ? '#426ea8' : '#242c42';
    const button = this.choiceButtons[index];
    button?.dimensions.setPosition(
      this.choicesContainer.dimensions.left() + centerX,
      this.choicesContainer.dimensions.top() + y - this.choicesContainer.scrollY()
    );
    button?.dimensions.setSize(width, height);
    button?.dimensions.setPivot(0.5, 0.5);

    GameContext.drawRect(x, y - height * 0.5, width, height, color);
    if (selected) {
      GameContext.drawRect(x, y - height * 0.5, 4, height, '#72dcff');
    }
    const titleLabel = this.choiceTitleLabels[index];
    titleLabel.setText(title);
    this.layoutLabel(titleLabel, centerX, y - height * 0.08,
      width - 24, height * 0.48, Math.max(13, Math.min(height * 0.32, 18)));
    titleLabel.setStyle({ color: selected ? '#ffffff' : '#b6c5ff' });
    titleLabel.draw();
    const descriptionLabel = this.choiceDescriptionLabels[index];
    descriptionLabel.setText(description);
    this.layoutLabel(descriptionLabel, centerX, title ? y + height * 0.28 : y,
      width - 24, height * 0.38, Math.max(10, Math.min(height * 0.22, 13)));
    descriptionLabel.draw();
  }

  /**
   * Applies the layout label operation to GameSelector.
   * @param {Label} label The label supplied to this operation.
   * @param {number} x Horizontal coordinate in the owning coordinate space.
   * @param {number} y Vertical coordinate in the owning coordinate space.
   * @param {number} width Width of the represented area.
   * @param {number} height Height of the represented area.
   * @param {number} fontSize Font size used to render the label.
   * @returns {void}
   * @private
   */
  private layoutLabel(label: Label, x: number, y: number, width: number, height: number, fontSize: number): void {
    label.dimensions.setPosition(x, y);
    label.dimensions.setSize(width, height);
    label.dimensions.setPivot(0.5, 0.5);
    label.setStyle({ fontSize });
  }

  /**
   * Selects and launches the mission card tapped by the pointer.
   * @property {(x: number, y: number) => void} handlePointerDown
   * @private
   * @readonly
   * @returns {void}
   */

  private createChoiceButtons(): void {
    this.choicesContainer.clear();
    this.choiceButtons = this.choices.map((_, index) => new Button(new Texture({}, 0, 0), {
      onClick: () => {
        if (this.started) return;
        this.selectedIndex = index;
        this.startSelectedGame();
      }
    }));
    this.choices.forEach((choice, index) => {
      this.choicesContainer.add({
        dimensions: this.choiceButtons[index].dimensions,
        draw: () => this.drawChoice(
          choice.title,
          choice.description,
          this.getChoiceY(index),
          this.selectedIndex === index || this.choiceButtons[index].state() === 'hover',
          index
        )
      });
    });
  }

  /**
   * Starts the selected game's factory and stops the selector loop.
   * @private
   * @return {void}
   */
  private startSelectedGame(): void {
    if (this.started) return;

    this.pause();
    void SceneManager.goTo(`game:${this.choices[this.selectedIndex].title}`);
  }
}
