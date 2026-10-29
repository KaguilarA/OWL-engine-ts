import { signalValue } from 'reactive-values';
import { MathUtils, GameContext } from './';
import { GameControls, GameInput } from '../input';
import { Label } from '../ui';
import { SceneLayer, SceneManager, WorldScene } from '../scene';
import type { GameControlsOptions, GameScene, LabelRenderState } from '../interfaces';

/**
 * Shared lifecycle for every playable game.
 *
 * Subclasses implement only game-specific state, update, rendering, restart,
 * and optional cleanup behavior. The engine owns the animation loop, pause,
 * reset, game-selector navigation, shared controls, and end-state actions.
 *
 * @class BaseGame
 * @abstract
 */
export default abstract class implements GameScene {
  /**
   * Scene graph available to games that use the world APIs.
   * @property {WorldScene} worldScene
   * @protected
   * @readonly
   */
  protected readonly worldScene = new WorldScene();
  /**
   * Default layer for actors updated by the game loop.
   * @property {SceneLayer} worldActors
   * @protected
   * @readonly
   */
  protected readonly worldActors = new SceneLayer({ name: 'Actors', updateObjects: false });
  /**
   * Shared game controls.
   * @property {GameControls} controls
   * @protected
   */
  protected readonly controls: GameControls;
  /**
   * Whether the game loop is active.
   * @property {Signal<boolean>} running
   * @private
   */
  private readonly running = signalValue(true);
  /**
   * Prevents repeated disposal and late asynchronous starts after leaving a game.
   * @property {SignalValue<boolean>} disposed
   * @private
   */
  private readonly disposed = signalValue(false);
  /**
   * Scheduled animation frame cancelled when this instance is disposed.
   * @property {SignalValue<number | undefined>} frameId
   * @private
   */
  private readonly frameId = signalValue<number | undefined>(undefined);
  /**
   * Input context requested by the subclass, activated only when its prepared scene starts.
   * @property {SignalValue<string>} inputContext
   * @private
   */
  private readonly inputContext = signalValue('gameplay');
  /**
   * Whether subclass initialization completed and its lifecycle may begin rendering.
   * @property {SignalValue<boolean>} ready
   * @private
   */
  private readonly ready = signalValue(false);
  /**
   * Previous animation-frame timestamp.
   * @property {Signal<number>} lastFrameTime
   * @private
   */
  private readonly lastFrameTime = signalValue(performance.now());
  /**
   * Last observed viewport width.
   * @property {Signal<number>} viewportWidth
   * @private
   */
  private readonly viewportWidth = signalValue(GameContext.viewportWidth());
  /**
   * Last observed viewport height.
   * @property {Signal<number>} viewportHeight
   * @private
   */
  private readonly viewportHeight = signalValue(GameContext.viewportHeight());
  /**
   * Optional selector callback.
   * @property {Function|undefined} onReturnToMenu
   * @private
   */
  private readonly onReturnToMenu: (() => void) | undefined;
  /**
   * Subclass resource cleanup callbacks.
   * @property {Function[]} cleanups
   * @private
   */
  private readonly cleanups: Array<() => void> = [];
  /**
   * Pending debounced viewport layout callback.
   * @property {number | undefined} pendingViewportLayout
   * @private
   */
  private pendingViewportLayout: number | undefined;
  /**
   * Reusable labels indexed by their draw order.
   * @property {Map<number, Label>} labels
   * @private
   * @readonly
   */
  private readonly labels = new Map<number, Label>();
  /**
   * Cached render properties for each reusable label.
   * @property {LabelRenderState[]} labelRenderStates
   * @private
   * @readonly
   */
  private readonly labelRenderStates: LabelRenderState[] = [];
  /**
   * Current label draw-order slot.
   * @property {number} labelCursor
   * @private
   */
  private labelCursor = 0;

  /**
   * Creates shared controls and stores the optional selector callback and HUD options.
   * @constructor
   * @protected
   * @param {Function} [onReturnToMenu] Callback used to return to the selector.
   * @param {GameControlsOptions} [controlOptions] Visibility options for shared controls.
   * @return {void}
   */
  protected constructor(
    onReturnToMenu?: () => void,
    controlOptions: GameControlsOptions = {}
  ) {
    this.onReturnToMenu = onReturnToMenu;
    this.worldScene.addLayer(this.worldActors);
    this.controls = new GameControls(
      () => this.restart(),
      () => this.returnToMenu(),
      controlOptions
    );
  }

  /**
   * Starts the shared game loop after subclass initialization is complete.
   * @protected
   * @return {void}
   * @param {string} [inputContext] The input context supplied to this operation.
   */
  protected start(inputContext = 'gameplay'): void {
    if (this.disposed() || this.frameId() !== undefined) return;
    this.inputContext.set(inputContext);
    this.ready.set(true);
    if (['loading', 'entering'].includes(SceneManager.state())) return;
    GameInput.activateContext(inputContext);
    this.gameLoop();
  }

  /**
   * Advances game-specific state for one unpaused frame.
   * @protected
   * @abstract
   * @param {number} deltaSeconds Duration of the frame in seconds.
   * @return {void}
   */
  protected abstract updateGame(deltaSeconds: number): void;

  /**
   * Draws the game's scene before the shared engine controls.
   * @protected
   * @abstract
   * @return {void}
   */
  protected abstract drawGame(): void;

  /**
   * Resets game-specific state when the player restarts.
   * @protected
   * @abstract
   * @return {void}
   */
  protected abstract restartGame(): void;

  /**
   * Reports whether the game has reached a win or loss state.
   * @protected
   * @abstract
   * @return {boolean} Whether the game has ended.
   */
  protected abstract get isGameOver(): boolean;

  /**
   * Draws the engine world at the chosen point in the game's render order.
   * @protected
   * @return {void}
   */
  protected drawWorldScene(): void {
    this.worldScene.draw();
  }

  /**
   * Registers a listener or resource cleanup for when this game is closed.
   * @protected
   * @param {Function} cleanup Cleanup callback for a resource or listener.
   * @return {void}
   */
  protected registerCleanup(cleanup: () => void): void {
    if (this.disposed()) { cleanup(); return; }
    this.cleanups.push(cleanup);
  }

  /**
   * Draws the shared restart and return-to-selector actions.
   * @protected
   * @return {void}
   */
  protected drawEndActions(): void {
    this.controls.drawEndActions();
  }

  /**
   * Recalculates game-specific layout after the reactive viewport changes.
   * @protected
   * @return {void}
   */
  protected onViewportChanged(): void {}

  /**
   * Releases game-specific listeners or transient resources before returning
   * to the selector.
   * @protected
   * @return {void}
   */
  protected disposeGame(): void {}

  /**
   * Runs one lifecycle frame, then schedules the next animation frame.
   * @private
   * @param {number} time Current browser animation timestamp.
   * @return {void}
   * @property {(time?: number) => void} gameLoop
   * @private
   */
  private gameLoop = (time = performance.now()): void => {
    if (!this.running()) return;

    const deltaSeconds = MathUtils.clamp((time - this.lastFrameTime()) / 1000, 0, 0.05);
    this.lastFrameTime.set(time);
    this.syncViewport();
    this.updateFrame(deltaSeconds);
    if (!this.running()) return;
    this.drawFrame();
    this.frameId.set(requestAnimationFrame(this.gameLoop));
  };

  /**
   * Synchronizes the game viewport and coalesces resize callbacks.
   * @private
   * @return {void}
   */
  private syncViewport(): void {
    const width = GameContext.viewportWidth();
    const height = GameContext.viewportHeight();
    if (width === this.viewportWidth() && height === this.viewportHeight()) return;
    this.viewportWidth.set(width);
    this.viewportHeight.set(height);
    this.scheduleViewportLayout();
  }

  /**
   * Advances game and scene state when the game is active.
   * @private
   * @param {number} deltaSeconds Duration of the frame in seconds.
   * @return {void}
   */
  private updateFrame(deltaSeconds: number): void {
    GameInput.update();
    if (GameInput.wasPressed('back')) {
      this.returnToMenu();
      return;
    }
    if (GameInput.wasPressed('pause') && !this.isGameOver) this.controls.togglePause();
    if (SceneManager.activeScene === this) SceneManager.setPaused(this.controls.isPaused);
    if (this.isGameOver && GameInput.wasPressed('confirm')) this.restart();
    if (this.controls.isPaused || this.isGameOver) return;
    this.updateGame(deltaSeconds);
    this.worldScene.update(deltaSeconds);
  }

  /**
   * Draws the game and the shared controls in lifecycle order.
   * @private
   * @return {void}
   */
  private drawFrame(): void {
    this.labelCursor = 0;
    this.drawGame();
    if (this.isGameOver) {
      this.drawEndActions();
      this.controls.drawFullscreenOnly();
      return;
    }
    this.controls.draw();
  }

  /**
   * Draws a cached Label in the same anchor position and size used by the
   * game's former canvas text helper.
   * @protected
   * @return {void}
   * @param {string} text Text to parse, display, or assign.
   * @param {number} x Horizontal coordinate in the owning coordinate space.
   * @param {number} y Vertical coordinate in the owning coordinate space.
   * @param {number} fontSize Font size used to render the label.
   * @param {string} color Color applied when rendering this content.
   * @param {CanvasTextAlign} [align] The align supplied to this operation.
   * @param {number | undefined} [maxWidth] The max width supplied to this operation.
   */
  protected drawLabel(
    text: string,
    x: number,
    y: number,
    fontSize: number,
    color: string,
    align: CanvasTextAlign = 'left',
    maxWidth?: number
  ): void {
    const index = this.labelCursor++;
    const width = maxWidth !== undefined && maxWidth > 0 ? maxWidth : 0;
    const pivotX = align === 'center' ? 0.5 : align === 'right' ? 1 : 0;
    const state = this.getLabelRenderState(index, align, fontSize);
    const fittedFontSize = this.fitLabelFontSize(state, text, fontSize, width);
    const label = this.getOrCreateLabel(index, text, x, y, width, fittedFontSize, color, align, pivotX);
    this.updateLabel(label, state, text, x, y, fontSize, width, fittedFontSize, color, align, pivotX);
    label.draw();
  }

  /**
   * Returns or initializes the cached render state for a label slot.
   * @private
   * @param {number} index Label draw-order slot.
   * @param {CanvasTextAlign} align Horizontal text alignment.
   * @param {number} fontSize Requested font size.
   * @return {LabelRenderState}
   */
  private getLabelRenderState(index: number, align: CanvasTextAlign, fontSize: number): LabelRenderState {
    let state = this.labelRenderStates[index];
    if (state !== undefined) return state;
    state = { text: '', fontSize: -1, fittedFontSize: fontSize, width: -1, color: '', align, x: NaN, y: NaN };
    this.labelRenderStates[index] = state;
    return state;
  }

  /**
   * Calculates a fitted font size only when text or width inputs change.
   * @private
   * @param {LabelRenderState} state Cached label render state.
   * @param {string} text Text to measure.
   * @param {number} fontSize Requested font size.
   * @param {number} width Available label width.
   * @return {number}
   */
  private fitLabelFontSize(state: LabelRenderState, text: string, fontSize: number, width: number): number {
    if (state.text === text && state.fontSize === fontSize && state.width === width) return state.fittedFontSize;
    if (width <= 0) return fontSize;
    const context = GameContext.context;
    context.save();
    let measuredWidth: number;
    try {
      context.font = `${fontSize}px sans-serif`;
      measuredWidth = context.measureText(text).width;
    } finally {
      context.restore();
    }
    return measuredWidth > width ? Math.max(9, Math.floor(fontSize * width / measuredWidth)) : fontSize;
  }

  /**
   * Creates and stores a label the first time its draw slot is used.
   * @private
   * @param {number} index Label draw-order slot.
   * @param {string} text Label contents.
   * @param {number} x Horizontal label position.
   * @param {number} y Vertical label position.
   * @param {number} width Label width.
   * @param {number} fontSize Fitted font size.
   * @param {string} color Label color.
   * @param {CanvasTextAlign} align Horizontal text alignment.
   * @param {number} pivotX Horizontal label pivot.
   * @return {Label}
   */
  private getOrCreateLabel(
    index: number,
    text: string,
    x: number,
    y: number,
    width: number,
    fontSize: number,
    color: string,
    align: CanvasTextAlign,
    pivotX: number
  ): Label {
    let label = this.labels.get(index);
    if (label !== undefined) return label;
    label = new Label(text, {
      width,
      height: Math.max(12, fontSize * 1.4),
      x,
      y,
      pivotX,
      pivotY: 0,
      fontSize,
      color,
      align,
      baseline: 'alphabetic'
    });
    this.labels.set(index, label);
    return label;
  }

  /**
   * Updates only the label properties whose cached values changed.
   * @private
   * @param {Label} label Label to update.
   * @param {LabelRenderState} state Cached label render state.
   * @param {string} text Label contents.
   * @param {number} x Horizontal label position.
   * @param {number} y Vertical label position.
   * @param {number} fontSize Requested font size.
   * @param {number} width Label width.
   * @param {number} fittedFontSize Fitted font size.
   * @param {string} color Label color.
   * @param {CanvasTextAlign} align Horizontal text alignment.
   * @param {number} pivotX Horizontal label pivot.
   * @return {void}
   */
  private updateLabel(
    label: Label,
    state: LabelRenderState,
    text: string,
    x: number,
    y: number,
    fontSize: number,
    width: number,
    fittedFontSize: number,
    color: string,
    align: CanvasTextAlign,
    pivotX: number
  ): void {
    if (state.text !== text) label.setText(text);
    if (state.fittedFontSize !== fittedFontSize || state.color !== color || state.align !== align) {
      label.setStyle({ fontSize: fittedFontSize, color, align, baseline: 'alphabetic' });
    }
    if (state.x !== x || state.y !== y) label.dimensions.setPosition(x, y);
    const height = Math.max(12, fittedFontSize * 1.4);
    if (label.dimensions.getWidth() !== width || label.dimensions.getHeight() !== height) {
      label.dimensions.setSize(width, height);
    }
    if (state.align !== align) label.dimensions.setPivot(pivotX, 0);
    Object.assign(state, { text, fontSize, fittedFontSize, width, color, align, x, y });
  }

  /**
   * Coalesces viewport hooks until a resize gesture settles.
   * @private
   * @return {void}
   */
  private scheduleViewportLayout(): void {
    if (this.pendingViewportLayout !== undefined) {
      window.clearTimeout(this.pendingViewportLayout);
    }
    this.pendingViewportLayout = window.setTimeout(() => {
      this.pendingViewportLayout = undefined;
      if (this.running()) this.onViewportChanged();
    }, 120);
  }

  /**
   * Clears end actions before delegating a reset to the game.
   * @private
   * @return {void}
   */
  private restart(): void {
    if (SceneManager.activeScene === this) SceneManager.setPaused(false);
    GameInput.activateContext(GameInput.context());
    this.controls.hideEndActions();
    this.restartGame();
  }

  /**
   * Stops the loop, releases resources, and returns to the selector.
   * @private
   * @return {void}
   */
  private returnToMenu(): void {
    this.dispose();
    this.onReturnToMenu?.();
  }

  /**
   * Suspends simulation while retaining this game's scene resources.
   * @returns {void}
   */
  public pause(): void { this.controls.setPaused(true); }

  /**
   * Resumes simulation and resets the frame clock after loading or pause.
   * @returns {void}
   */
  public resume(): void {
    if (this.disposed()) return;
    this.controls.setPaused(false);
    this.lastFrameTime.set(performance.now());
    if (this.ready() && this.frameId() === undefined) {
      GameInput.activateContext(this.inputContext());
      this.gameLoop();
    }
  }

  /**
   * Stops the game and attempts all owned cleanup exactly once, without navigating.
   * @returns {void}
   * @throws {AggregateError} When an owned resource cannot be released.
   */
  public dispose(): void {
    if (this.disposed()) return;
    this.disposed.set(true);
    this.running.set(false);
    if (this.frameId() !== undefined) cancelAnimationFrame(this.frameId()!);
    this.frameId.set(undefined);
    if (this.pendingViewportLayout !== undefined) {
      window.clearTimeout(this.pendingViewportLayout);
      this.pendingViewportLayout = undefined;
    }
    const failures: unknown[] = [];
    for (const cleanup of [() => this.controls.dispose(), ...this.cleanups.splice(0).reverse(),
      () => this.disposeGame(), () => this.worldScene.clear()]) {
      try { cleanup(); } catch (error) { failures.push(error); }
    }
    this.labels.clear();
    this.labelRenderStates.length = 0;
    GameInput.clear();
    if (failures.length) throw new AggregateError(failures, 'Game cleanup failed.');
  }
}
