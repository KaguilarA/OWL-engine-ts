import { signalValue } from 'reactive-values';
import { GameInput } from '../input';
import { SceneTransitionView } from '../ui';
import { SceneResources } from './';
import type { GameScene, SaveData, SceneInstance, SceneLifecycleState, SceneLoadContext, SceneRequest } from '../interfaces';

/**
 * Serializes scene transitions and owns lifecycle state, failure recovery, and session progress.
 * Shared asset caches remain owned by GameLoader, outside each scene's resource scope.
 * @class SceneManager
 */
export default (class {
  /**
   * Unique lifecycle coordinator for the application.
   * @property {SceneManager} instance
   */
  public static readonly instance = new this();
  /**
   * Observable transition or execution stage.
   * @property {SignalValue<SceneLifecycleState>} state
   */
  public readonly state = signalValue<SceneLifecycleState>('idle');
  /**
   * Monotonic preparation fraction for the current request.
   * @property {SignalValue<number>} progress
   */
  public readonly progress = signalValue(0);
  /**
   * Last transition failure, cleared by a new attempt.
   * @property {SignalValue<Error | undefined>} error
   */
  public readonly error = signalValue<Error | undefined>(undefined);
  /**
   * Factories create fresh scene instances for each activation.
   * @property {SignalValue<ReadonlyMap>} factories
   * @private
   */
  private readonly factories = signalValue<ReadonlyMap<string, (context: SceneLoadContext) => GameScene | Promise<GameScene>>>(new Map());
  /**
   * Scope and hooks of the currently committed scene.
   * @property {SignalValue<SceneInstance | undefined>} active
   * @private
   */
  private readonly active = signalValue<SceneInstance | undefined>(undefined);
  /**
   * Last attempted activation, retained for retry after failure.
   * @property {SignalValue<SceneRequest | undefined>} request
   * @private
   */
  private readonly request = signalValue<SceneRequest | undefined>(undefined);
  /**
   * Queued and executing operations protect factories before their first asynchronous step.
   * @property {SignalValue<number>} pending
   * @private
   */
  private readonly pending = signalValue(0);
  /**
   * Explicit session data survives scene disposal but is not automatically saved to disk.
   * @property {SignalValue<ReadonlyMap<string, SaveData>>} session
   * @private
   */
  private readonly session = signalValue<ReadonlyMap<string, SaveData>>(new Map());
  /**
   * Internal promise chain prevents overlapping entry and cleanup operations.
   * @property {Promise<void>} queue
   * @private
   */
  private queue: Promise<void> = Promise.resolve();

  /**
   * Restricts lifecycle ownership to the shared instance.
   * @constructor
   * @returns {void}
   * @private
   */
  private constructor() {}

  /**
   * Returns the registered identifier of the committed scene.
   * @returns {string | undefined} Active identifier, absent during preparation or idle.
   */
  public get activeId(): string | undefined { return this.active()?.id; }

  /**
   * Returns the committed lifecycle object without transferring ownership.
   * @returns {GameScene | undefined} Active scene instance.
   */
  public get activeScene(): GameScene | undefined { return this.active()?.scene; }

  /**
   * Registers a factory without constructing a scene or acquiring scene resources.
   * @param {string} id Stable, nonempty scene identifier.
   * @param {Function} factory Factory receiving its exclusive resource and loading scope.
   * @returns {void}
   * @throws {Error} If the identifier is empty or already registered.
   */
  public register(id: string, factory: (context: SceneLoadContext) => GameScene | Promise<GameScene>): void {
    if (!id.trim() || this.has(id)) throw new Error(`Invalid or duplicate scene: ${id}`);
    this.factories.set(new Map(this.factories()).set(id, factory));
  }

  /**
   * Reports whether a scene factory is available.
   * @param {string} id Registered identifier to query.
   * @returns {boolean} Whether the identifier has a factory.
   */
  public has(id: string): boolean { return this.factories().has(id); }

  /**
   * Lists registered identifiers without exposing the mutable factory registry.
   * @returns {readonly string[]} Detached registry key snapshot.
   */
  public getRegisteredIds(): readonly string[] { return [...this.factories().keys()]; }

  /**
   * Removes an unused factory while protecting active or pending scene ownership.
   * @param {string} id Identifier to remove.
   * @returns {void}
   * @throws {Error} If an activation or teardown is pending or the scene is active.
   */
  public unregister(id: string): void {
    if (this.activeId === id || this.pending() > 0) {
      throw new Error('Cannot unregister an active scene or modify factories during a transition.');
    }
    const next = new Map(this.factories());
    next.delete(id);
    this.factories.set(next);
  }

  /**
   * Queues an activation; failures return false and leave a retryable error view.
   * Requests are serialized so cleanup always finishes before the next factory runs.
   * @param {string} id Scene factory to instantiate.
   * @param {SaveData} [data] Detached payload supplied to load and entry hooks.
   * @returns {Promise<boolean>} Whether the requested scene was activated.
   */
  public goTo(id: string, data: SaveData = null): Promise<boolean> {
    if (!this.has(id)) return Promise.reject(new Error(`Unknown scene: ${id}`));
    const request: SceneRequest = { id, data: structuredClone(data) };
    this.pending.set(this.pending() + 1);
    const operation = this.queue.then(async () => {
      try { return await this.activate(request); }
      finally { this.pending.set(this.pending() - 1); }
    });
    this.queue = operation.then(() => undefined, () => undefined);
    return operation;
  }

  /**
   * Retries the last failed activation using its original detached payload.
   * @returns {Promise<boolean>} Whether the failed scene could now be activated.
   */
  public retry(): Promise<boolean> {
    const request = this.request();
    return this.state() === 'error' && request ? this.goTo(request.id, request.data) : Promise.resolve(false);
  }

  /**
   * Suspends or resumes the committed scene without unloading its resources.
   * @param {boolean} paused Whether gameplay and interaction should be suspended.
   * @returns {void}
   */
  public setPaused(paused: boolean): void {
    const current = this.active();
    if (!current || !['running', 'paused'].includes(this.state())) return;
    if (paused === (this.state() === 'paused')) return;
    if (paused) current.scene.pause?.();
    else current.scene.resume?.();
    this.setState(paused ? 'paused' : 'running');
  }

  /**
   * Stores detached progress independently of scene-owned resources.
   * @param {string} key Namespace identifying the game's session data.
   * @param {SaveData} value JSON progress snapshot; disk persistence is explicitly owned by the game.
   * @returns {void}
   */
  public setSessionData(key: string, value: SaveData): void {
    this.session.set(new Map(this.session()).set(key, structuredClone(value)));
  }

  /**
   * Reads a detached session snapshot without exposing the retained mutable data.
   * @param {string} key Namespace to read.
   * @returns {SaveData | undefined} Stored progress, if present.
   */
  public getSessionData(key: string): SaveData | undefined {
    const value = this.session().get(key);
    return value === undefined ? undefined : structuredClone(value);
  }

  /**
   * Clears explicitly retained session progress, such as when starting a new profile.
   * @returns {void}
   */
  public clearSession(): void { this.session.set(new Map()); }

  /**
   * Queues complete scene teardown without deleting shared assets or session data.
   * @returns {Promise<void>} Completion of all instance cleanup attempts.
   */
  public unload(): Promise<void> {
    this.pending.set(this.pending() + 1);
    const operation = this.queue.then(async () => {
      try {
        await this.leave();
        this.request.set(undefined);
        this.error.set(undefined);
        this.progress.set(0);
        this.setState('idle');
      } catch (error) {
        this.fail(error);
        throw error;
      } finally {
        this.pending.set(this.pending() - 1);
      }
    });
    this.queue = operation.catch(() => undefined);
    return operation;
  }

  /**
   * Loads and enters a fresh instance, disposing partial work on any failure.
   * @param {SceneRequest} request Activation request captured before queueing.
   * @returns {Promise<boolean>} Successful commitment of the target scene.
   * @private
   */
  private async activate(request: SceneRequest): Promise<boolean> {
    if (this.activeId === request.id && ['running', 'paused'].includes(this.state())) return true;
    this.request.set(request);
    this.error.set(undefined);
    this.progress.set(0);
    let candidate: SceneInstance | undefined;
    let entered = false;
    const resources = new SceneResources();
    const controller = new AbortController();
    const context: SceneLoadContext = {
      data: structuredClone(request.data), resources, signal: controller.signal,
      reportProgress: fraction => {
        if (!controller.signal.aborted && Number.isFinite(fraction) && this.state() === 'loading') {
          this.progress.set(Math.max(this.progress(), Math.min(1, Math.max(0, fraction))));
          this.renderTransition();
        }
      }
    };
    try {
      await this.leave();
      this.setState('loading');
      const scene = await this.factories().get(request.id)!(context);
      candidate = { id: request.id, scene, controller, context };
      await scene.load?.(context);
      this.progress.set(1);
      this.setState('entering');
      entered = true;
      await scene.enter?.(context);
      scene.resume?.();
      this.active.set(candidate);
      this.setState('running');
      return true;
    } catch (error) {
      try {
        if (candidate) await this.release(candidate, entered);
        else { controller.abort(); await resources.dispose(); }
      } catch (cleanupError) {
        error = new AggregateError([error, cleanupError], 'Scene activation and cleanup failed.');
      }
      this.fail(error);
      return false;
    }
  }

  /**
   * Clears active ownership before releasing the previous scene.
   * @returns {Promise<void>} Completion of the previous scene's teardown.
   * @private
   */
  private async leave(): Promise<void> {
    const previous = this.active();
    this.active.set(undefined);
    GameInput.clear();
    if (!previous) return;
    this.setState('exiting');
    await this.release(previous, true);
  }

  /**
   * Aborts pending work and attempts every lifecycle and resource cleanup step.
   * @param {SceneInstance} instance Instance whose ownership is ending.
   * @param {boolean} entered Whether its entry hook started and requires a matching exit.
   * @returns {Promise<void>} Completion or an aggregate of cleanup failures.
   * @private
   */
  private async release(instance: SceneInstance, entered: boolean): Promise<void> {
    instance.controller.abort();
    const failures: unknown[] = [];
    for (const cleanup of [
      () => entered ? instance.scene.pause?.() : undefined,
      () => entered ? instance.scene.exit?.() : undefined,
      () => instance.scene.dispose?.(),
      () => instance.context.resources.dispose()
    ]) {
      try { await cleanup(); } catch (error) { failures.push(error); }
    }
    if (failures.length) throw new AggregateError(failures, 'Scene teardown failed.');
  }

  /**
   * Stores a normalized failure and makes retry available after cleanup.
   * @param {unknown} error Failure thrown by a factory, lifecycle hook, or cleanup.
   * @returns {void}
   * @private
   */
  private fail(error: unknown): void {
    this.error.set(error instanceof Error ? error : new Error(String(error)));
    this.setState('error');
  }

  /**
   * Publishes lifecycle changes and updates the shared transition overlay.
   * @param {SceneLifecycleState} state New lifecycle stage.
   * @returns {void}
   * @private
   */
  private setState(state: SceneLifecycleState): void {
    this.state.set(state);
    this.renderTransition();
  }

  /**
   * Synchronizes the accessible overlay without creating another animation loop.
   * @returns {void}
   * @private
   */
  private renderTransition(): void {
    SceneTransitionView.render(this.state(), this.progress(), this.error(), () => { void this.retry(); });
  }
}).instance;
