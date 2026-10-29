import { signalValue } from 'reactive-values';
import { GameSaves } from '../core';
import type { InputActionState, InputBindings, InputGamepad, InputPreferences, SaveStorage } from '../interfaces';
import { idleInputState, GameEvents, createInputBindings, isInputBindings, isInputPreferences } from './';

/**
 * Global input router; context data and public action snapshots are reactive.
 * @class InputService
 */
export default (class {
  /**
   * Instance configuration or state owned by InputService.
   * @property {InputService} instance
   * @readonly
   * @public
   */
  public static readonly instance = new this();
  /**
   * Reactive context state owned by InputService.
   * @property {SignalValue<string> & (() => string)} context
   * @readonly
   * @public
   */
  public readonly context = signalValue('gameplay');
  /**
   * Reactive states state owned by InputService.
   * @property {SignalValue<Readonly<Record<string, InputActionState>>> & (() => Readonly<Record<string, InputActionState>>)} states
   * @readonly
   * @public
   */
  public readonly states = signalValue<Readonly<Record<string, InputActionState>>>({});
  /**
   * Reactive deadzone state owned by InputService.
   * @property {SignalValue<number> & (() => number)} deadzone
   * @readonly
   * @public
   */
  public readonly deadzone = signalValue(0.18);
  /**
   * Reactive definitions state owned by InputService.
   * @property {SignalValue<Record<string, InputBindings>> & (() => Record<string, InputBindings>)} definitions
   * @readonly
   * @private
   */
  private readonly definitions = signalValue<Record<string, InputBindings>>({
    gameplay: createInputBindings('gameplay'), moonfall: createInputBindings('moonfall'),
    menu: createInputBindings('menu'), editor: createInputBindings('editor')
  });
  /**
   * Reactive overrides state owned by InputService.
   * @property {SignalValue<InputPreferences> & (() => InputPreferences)} overrides
   * @readonly
   * @private
   */
  private readonly overrides = signalValue<InputPreferences>({});
  /**
   * Reactive pointers state owned by InputService.
   * @property {SignalValue<ReadonlyMap<number, ReadonlyMap<string, number>>> & (() => ReadonlyMap<number, ReadonlyMap<string, number>>)} pointers
   * @readonly
   * @private
   */
  private readonly pointers = signalValue<ReadonlyMap<number, ReadonlyMap<string, number>>>(new Map());
  /**
   * Reactive pending pointers state owned by InputService.
   * @property {SignalValue<ReadonlyMap<number, ReadonlyMap<string, number>>> & (() => ReadonlyMap<number, ReadonlyMap<string, number>>)} pendingPointers
   * @readonly
   * @private
   */
  private readonly pendingPointers = signalValue<ReadonlyMap<number, ReadonlyMap<string, number>>>(new Map());
  /**
   * Reactive blocked state owned by InputService.
   * @property {SignalValue<ReadonlySet<string>> & (() => ReadonlySet<string>)} blocked
   * @readonly
   * @private
   */
  private readonly blocked = signalValue<ReadonlySet<string>>(new Set());
  /**
   * Reactive focused state owned by InputService.
   * @property {SignalValue<boolean> & (() => boolean)} focused
   * @readonly
   * @private
   */
  private readonly focused = signalValue(true);
  /**
   * Reactive initialized state owned by InputService.
   * @property {SignalValue<boolean> & (() => boolean)} initialized
   * @readonly
   * @private
   */
  private readonly initialized = signalValue(false);

  /**
   * Creates the input router without installing browser listeners during import.
   * @constructor
   * @returns {void}
   * @private
   */
  private constructor() {}

  /**
   * Installs shared input listeners once, after barrel evaluation has completed.
   * @returns {void}
   * @private
   */
  private initialize(): void {
    if (this.initialized()) return;
    this.initialized.set(true);
    GameEvents.initEvents();
    GameEvents.addPointerEndListener((pointer) => {
      if (!pointer.cancelled) return;
      const next = new Map(this.pendingPointers());
      next.delete(pointer.id);
      this.pendingPointers.set(next);
      const held = new Map(this.pointers());
      held.delete(pointer.id);
      this.pointers.set(held);
    });
    window.addEventListener('blur', this.suspend);
    window.addEventListener('focus', this.resume);
    document.addEventListener('visibilitychange', this.onVisibility);
  }

  /**
   * Register custom editor, menu or game contexts without changing the router.
   * @param {string} name Name identifying the registered resource.
   * @param {InputBindings} bindings Mapping from action names to physical controls.
   * @returns {void}
   * @public
   */
  public registerContext(name: string, bindings: InputBindings): void {
    if (!name.trim() || !isInputBindings(bindings)) throw new Error('Invalid input context.');
    this.definitions.set({ ...this.definitions(), [name]: structuredClone(bindings) });
  }

  /**
   * Release virtual controls and suppress hardware held across a context change.
   * @param {string} name Name identifying the registered resource.
   * @returns {void}
   * @public
   */
  public activateContext(name: string): void {
    this.initialize();
    if (!name.trim()) throw new Error('Input context requires a name.');
    this.context.set(name);
    this.pointers.set(new Map());
    this.pendingPointers.set(new Map());
    GameEvents.consumeKeyPresses();
    this.states.set({});
    const pads = this.readGamepads();
    const blocked = new Set<string>();
    for (const [action, binding] of Object.entries(this.resolveBindings())) {
      if (this.readBinding(binding, pads) > 0) blocked.add(action);
    }
    this.blocked.set(blocked);
  }

  /**
   * Detached bindings can be displayed and edited without mutating the defaults.
   * @param {string} [context] Name of the input context whose bindings are requested.
   * @returns {InputBindings}
   * @public
   */
  public getBindings(context = this.context()): InputBindings {
    return structuredClone(this.resolveBindings(context));
  }

  /**
   * Combines context defaults with persisted or user-defined overrides.
   * @param {string} [context] Name of the input context whose bindings are requested.
   * @returns {InputBindings}
   * @private
   */
  private resolveBindings(context = this.context()): InputBindings {
    return {
      ...(this.definitions()[context] ?? createInputBindings(context)),
      ...this.overrides()[context]
    };
  }

  /**
   * Replaces the physical binding for one action in the selected context.
   * @param {string} action Semantic action to read or configure.
   * @param {InputBinding} binding Physical controls assigned to the action.
   * @param {string} [context] Name of the input context whose bindings are requested.
   * @returns {void}
   * @public
   */
  public rebind(action: string, binding: InputBindings[string], context = this.context()): void {
    if (!isInputBindings({ [action]: binding })) throw new Error('Invalid action binding.');
    this.overrides.set({
      ...this.overrides(),
      [context]: { ...this.overrides()[context], [action]: structuredClone(binding) }
    });
    if (context === this.context()) this.activateContext(context);
  }

  /**
   * Restores the default bindings for the selected context.
   * @param {string} [context] Name of the input context whose bindings are requested.
   * @returns {void}
   * @public
   */
  public resetBindings(context = this.context()): void {
    const next = { ...this.overrides() };
    delete next[context];
    this.overrides.set(next);
    if (context === this.context()) this.activateContext(context);
  }

  /**
   * Persists context-specific binding overrides using the shared save service.
   * @param {SaveStorage | undefined} [storage] Optional storage adapter; browser storage is used by default.
   * @returns {SaveResult<SavedGame<InputPreferences>>}
   * @public
   */
  public savePreferences(storage?: SaveStorage) {
    return GameSaves.save('engine-input', this.overrides(), 1, 'bindings', storage);
  }

  /**
   * Validates and restores saved binding overrides without replacing defaults on failure.
   * @param {SaveStorage | undefined} [storage] Optional storage adapter; browser storage is used by default.
   * @returns {SaveResult<SavedGame<InputPreferences>>}
   * @public
   */
  public loadPreferences(storage?: SaveStorage) {
    const result = GameSaves.load('engine-input', isInputPreferences, 1, 'bindings', storage);
    if (result.ok) {
      this.overrides.set(structuredClone(result.value.data));
      this.activateContext(this.context());
    }
    return result;
  }

  /**
   * One pointer may hold several actions; other pointers remain independent.
   * @param {number} pointer Identifier of the pointer owning the action.
   * @param {string} action Semantic action to read or configure.
   * @param {number} value Value to validate or apply.
   * @returns {void}
   * @public
   */
  public setPointerAction(pointer: number, action: string, value: number): void {
    const next = new Map(this.pointers());
    const actions = new Map(next.get(pointer));
    if (!Number.isFinite(value)) throw new Error('Input value must be finite.');
    if (value <= 0) actions.delete(action);
    else {
      actions.set(action, Math.min(1, value));
      const pending = new Map(this.pendingPointers());
      pending.set(pointer, new Map(pending.get(pointer)).set(action, Math.min(1, value)));
      this.pendingPointers.set(pending);
    }
    if (actions.size) next.set(pointer, actions);
    else next.delete(pointer);
    this.pointers.set(next);
  }

  /**
   * Disabling a control discards an unsampled press instead of producing a tap.
   * @param {number} pointer Identifier of the pointer owning the action.
   * @param {string} action Semantic action to read or configure.
   * @returns {void}
   * @public
   */
  public cancelPointerAction(pointer: number, action: string): void {
    this.setPointerAction(pointer, action, 0);
    const next = new Map(this.pendingPointers());
    const actions = new Map(next.get(pointer));
    actions.delete(action);
    if (actions.size) next.set(pointer, actions);
    else next.delete(pointer);
    this.pendingPointers.set(next);
  }

  /**
   * Sample exactly once before updating a game or menu, even while paused.
   * @param {readonly (InputGamepad | null)[]} [gamepads] Connected standard-mapped gamepads sampled for this frame.
   * @returns {void}
   * @public
   */
  public update(gamepads: readonly (InputGamepad | null)[] = this.readGamepads()): void {
    this.initialize();
    const previous = this.states();
    const next: Record<string, InputActionState> = {};
    const blocked = new Set(this.blocked());
    const bindings = this.resolveBindings();
    const keyPresses = GameEvents.consumeKeyPresses();
    const names = new Set([...Object.keys(bindings), ...Object.keys(previous)]);
    for (const actions of this.pointers().values()) for (const name of actions.keys()) names.add(name);
    for (const actions of this.pendingPointers().values()) for (const name of actions.keys()) names.add(name);
    for (const name of names) {
      let value = this.focused() ? this.readBinding(bindings[name] ?? {}, gamepads) : 0;
      if (this.focused() && bindings[name]?.keys?.some((key) =>
        keyPresses.has(key.length === 1 ? key.toLowerCase() : key))) value = 1;
      if (blocked.has(name)) {
        if (value === 0) blocked.delete(name);
        value = 0;
      }
      if (this.focused()) {
        for (const actions of this.pointers().values()) value = Math.max(value, actions.get(name) ?? 0);
        for (const actions of this.pendingPointers().values()) value = Math.max(value, actions.get(name) ?? 0);
      }
      const down = value > 0;
      const wasDown = previous[name]?.down ?? false;
      next[name] = Object.freeze({ value, down, pressed: down && !wasDown, released: !down && wasDown });
    }
    this.blocked.set(blocked);
    this.pendingPointers.set(new Map());
    this.states.set(Object.freeze(next));
  }

  /**
   * Returns the current frame snapshot for an action, or its idle state when absent.
   * @param {string} action Semantic action to read or configure.
   * @returns {InputActionState}
   * @public
   */
  public state(action: string): InputActionState { return this.states()[action] ?? idleInputState; }
  /**
   * Reports whether an action is held by any input source in the current frame.
   * @param {string} action Semantic action to read or configure.
   * @returns {boolean}
   * @public
   */
  public isDown(action: string): boolean { return this.state(action).down; }
  /**
   * Reports whether an action began during the current input sample.
   * @param {string} action Semantic action to read or configure.
   * @returns {boolean}
   * @public
   */
  public wasPressed(action: string): boolean { return this.state(action).pressed; }
  /**
   * Reports whether an action ended during the current input sample.
   * @param {string} action Semantic action to read or configure.
   * @returns {boolean}
   * @public
   */
  public wasReleased(action: string): boolean { return this.state(action).released; }
  /**
   * Returns the combined strength of an action between zero and one.
   * @param {string} action Semantic action to read or configure.
   * @returns {number}
   * @public
   */
  public value(action: string): number { return this.state(action).value; }
  /**
   * Combines opposite movement actions into a signed horizontal or vertical axis.
   * @param {"moveX" | "moveY"} axis
   * @returns {number}
   * @public
   */
  public axis(axis: 'moveX' | 'moveY'): number {
    return axis === 'moveX'
      ? this.value('moveRight') - this.value('moveLeft')
      : this.value('moveDown') - this.value('moveUp');
  }

  /**
   * Clear transient input when restarting or leaving a game.
   * @returns {void}
   * @public
   */
  public clear(): void {
    this.pointers.set(new Map());
    this.pendingPointers.set(new Map());
    this.states.set({});
    GameEvents.clearInput();
  }

  /**
   * Reads connected browser gamepads, returning an empty collection when unavailable.
   * @returns {readonly (InputGamepad | null)[]}
   * @private
   */
  private readGamepads(): readonly (InputGamepad | null)[] {
    try { return typeof navigator.getGamepads === 'function' ? navigator.getGamepads() : []; }
    catch { return []; }
  }

  /**
   * Combines keyboard and standard gamepad input for one binding.
   * @param {InputBinding} binding Physical controls assigned to the action.
   * @param {readonly (InputGamepad | null)[]} pads
   * @returns {number}
   * @private
   */
  private readBinding(binding: InputBindings[string], pads: readonly (InputGamepad | null)[]): number {
    if (binding.keys?.some((key) => GameEvents.isKeyPressed(key))) return 1;
    let value = 0;
    const deadzone = Math.max(0, Math.min(0.95, this.deadzone()));
    for (const pad of pads) {
      if (!pad?.connected || pad.mapping !== 'standard') continue;
      for (const index of binding.buttons ?? []) {
        const button = pad.buttons[index];
        if (button) value = Math.max(value, button.pressed ? 1 : button.value);
      }
      for (const axis of binding.axes ?? []) {
        const raw = (pad.axes[axis.index] ?? 0) * axis.direction;
        if (raw > deadzone) value = Math.max(value, (raw - deadzone) / (1 - deadzone));
      }
    }
    return Number.isFinite(value) ? Math.max(0, Math.min(1, value)) : 0;
  }

  /**
   * Suspend configuration or state owned by InputService.
   * @property {() => void} suspend
   * @readonly
   * @private
   */
  private readonly suspend = (): void => {
    this.focused.set(false);
    this.clear();
  };
  /**
   * Resume configuration or state owned by InputService.
   * @property {() => void} resume
   * @readonly
   * @private
   */
  private readonly resume = (): void => {
    this.focused.set(true);
    this.activateContext(this.context());
  };
  /**
   * Callback handling visibility for InputService.
   * @property {() => void} onVisibility
   * @readonly
   * @private
   */
  private readonly onVisibility = (): void => {
    if (document.hidden) this.suspend();
    else this.resume();
  };
}).instance;
