import { signalValue, type SignalValue } from 'reactive-values';
import { Dimensions } from '../core';
import { GameEvents } from '../input';
import { Texture } from '../rendering';
import type {
  ButtonOptions,
  GamePointer,
  TextureStateName
} from '../interfaces';

/**
 * Owns pointer hit-testing, activation, visual states, and teardown.
 * @class Button
 */
export default class {
  /**
   * Dimensions configuration or state owned by Button.
   * @property {default} dimensions
   * @readonly
   * @public
   */
  public readonly dimensions: Dimensions;
  /**
   * Presentation or lifecycle state selected for this object.
   * @property {SignalValue<TextureStateName>} state
   * @readonly
   * @public
   */
  public readonly state: SignalValue<TextureStateName> = signalValue<TextureStateName>('idle');
  /**
   * Texture configuration or state owned by Button.
   * @property {Texture} texture
   * @readonly
   * @private
   */
  private readonly texture: Texture;
  /**
   * Callback handling click for Button.
   * @property {() => void} onClick
   * @readonly
   * @private
   */
  private readonly onClick: () => void;
  /**
   * Callback handling press for Button.
   * @property {((pointerId: number) => void) | undefined} onPress
   * @readonly
   * @private
   */
  private readonly onPress: ((pointerId: number) => void) | undefined;
  /**
   * Callback handling release for Button.
   * @property {((pointerId: number, cancelled?: boolean | undefined) => void) | undefined} onRelease
   * @readonly
   * @private
   */
  private readonly onRelease: ((pointerId: number, cancelled?: boolean) => void) | undefined;
  /**
   * Remove listeners configuration or state owned by Button.
   * @property {(() => void)[]} removeListeners
   * @readonly
   * @private
   */
  private readonly removeListeners: Array<() => void>;
  /**
   * Shape configuration or state owned by Button.
   * @property {"rectangle" | "circle"} shape
   * @readonly
   * @private
   */
  private readonly shape: 'rectangle' | 'circle';
  /**
   * Reactive hovered state owned by Button.
   * @property {SignalValue<boolean> & (() => boolean)} hovered
   * @readonly
   * @private
   */
  private readonly hovered = signalValue(false);
  /**
   * Reactive blocked state owned by Button.
   * @property {SignalValue<boolean> & (() => boolean)} blocked
   * @readonly
   * @private
   */
  private readonly blocked = signalValue(false);
  /**
   * Reactive disabled state owned by Button.
   * @property {SignalValue<boolean> & (() => boolean)} disabled
   * @readonly
   * @private
   */
  private readonly disabled = signalValue(false);
  /**
   * Reactive pressed pointer state owned by Button.
   * @property {SignalValue<number | undefined> & (() => number | undefined)} pressedPointer
   * @readonly
   * @private
   */
  private readonly pressedPointer = signalValue<number | undefined>(undefined);
  /**
   * Reactive press active state owned by Button.
   * @property {SignalValue<boolean> & (() => boolean)} pressActive
   * @readonly
   * @private
   */
  private readonly pressActive = signalValue(false);
  /**
   * Reactive press origin state owned by Button.
   * @property {SignalValue<{ x: number; y: number; } | undefined> & (() => { x: number; y: number; } | undefined)} pressOrigin
   * @readonly
   * @private
   */
  private readonly pressOrigin = signalValue<{
  /**
   * Horizontal coordinate in the owning coordinate space.
   * @property {number} x
   */
  x: number;
  /**
   * Vertical coordinate in the owning coordinate space.
   * @property {number} y
   */
  y: number } | undefined>(undefined);
  /**
   * Reactive press moved state owned by Button.
   * @property {SignalValue<boolean> & (() => boolean)} pressMoved
   * @readonly
   * @private
   */
  private readonly pressMoved = signalValue(false);

  /**
   * Initializes Button and its owned resources from the supplied arguments.
   * @constructor
   * @param {Texture} texture The texture supplied to this operation.
   * @param {ButtonOptions} options Configuration controlling construction or behavior.
   * @returns {void}
   * @public
   */
  public constructor(texture: Texture, options: ButtonOptions) {
    this.texture = texture;
    this.onClick = options.onClick;
    this.onPress = options.onPress;
    this.onRelease = options.onRelease;
    this.shape = options.shape ?? 'rectangle';
    this.dimensions = texture.dimensions;
    const bounds = options.dimensions;
    if (bounds) {
      this.dimensions.setPosition(bounds.x, bounds.y);
      this.dimensions.setWidth(bounds.width);
      this.dimensions.setHeight(bounds.height);
      this.dimensions.setPivot(bounds.pivotX ?? this.dimensions.getPivotX(), bounds.pivotY ?? this.dimensions.getPivotY());
    }
    this.removeListeners = [
      GameEvents.addPointerDownListener(this.handlePointerDown),
      GameEvents.addPointerMoveListener(this.handlePointerMove),
      GameEvents.addPointerEndListener(this.handlePointerEnd),
      GameEvents.addPointerTarget((pointer) => !this.disabled() && !this.blocked() && this.contains(pointer))
    ];
  }

  /**
   * Blocks or unblocks pointer interaction, cancelling an active press when blocked.
   * @param {boolean} blocked The blocked supplied to this operation.
   * @returns {void}
   * @public
   */
  public setBlocked(blocked: boolean): void {
    if (this.blocked() === blocked) return;
    this.blocked.set(blocked);
    if (blocked) this.cancelPress();
    this.syncState();
  }

  /**
   * Enables or disables the button, cancelling an active press when disabled.
   * @param {boolean} disabled The disabled supplied to this operation.
   * @returns {void}
   * @public
   */
  public setDisabled(disabled: boolean): void {
    if (this.disabled() === disabled) return;
    this.disabled.set(disabled);
    if (disabled) this.cancelPress();
    this.syncState();
  }

  /**
   * Advances Button simulation and dependent presentation state for one frame.
   * @param {number} deltaSeconds Elapsed simulation time in seconds.
   * @returns {void}
   * @public
   */
  public update(deltaSeconds: number): void { this.texture.update(deltaSeconds); }
  /**
   * Renders Button using its current geometry and presentation state.
   * @returns {void}
   * @public
   */
  public draw(): void { this.texture.draw(); }
  /**
   * Releases this object’s owned state and subscriptions so it no longer participates in updates.
   * @returns {void}
   * @public
   */
  public destroy(): void {
    this.cancelPress();
    this.removeListeners.forEach((remove) => remove());
  }

  /**
   * Callback handling pointer down for Button.
   * @property {(pointer: GamePointer) => void} handlePointerDown
   * @readonly
   * @private
   */
  private readonly handlePointerDown = (pointer: GamePointer): void => {
    if (this.pressedPointer() !== undefined && this.pressedPointer() !== pointer.id) return;
    this.hovered.set(this.contains(pointer));
    if (!this.hovered() || this.disabled() || this.blocked()) return;
    this.pressedPointer.set(pointer.id);
    this.pressOrigin.set({ x: pointer.x, y: pointer.y });
    this.pressMoved.set(false);
    this.pressActive.set(true);
    this.onPress?.(pointer.id);
    this.syncState();
  };

  /**
   * Callback handling pointer move for Button.
   * @property {(pointer: GamePointer) => void} handlePointerMove
   * @readonly
   * @private
   */
  private readonly handlePointerMove = (pointer: GamePointer): void => {
    if (this.pressedPointer() !== undefined && this.pressedPointer() !== pointer.id) return;
    const inside = this.contains(pointer);
    const origin = this.pressOrigin();
    if (this.pressedPointer() === pointer.id && origin !== undefined
      && Math.hypot(pointer.x - origin.x, pointer.y - origin.y) >= 6) {
      this.pressMoved.set(true);
    }
    // Held gameplay controls tolerate finger drift; click-only widgets still cancel drags.
    const pressInside = inside && (!this.pressMoved() || this.onPress !== undefined);
    this.hovered.set(inside);
    if (this.pressedPointer() === pointer.id && this.pressActive() !== pressInside) {
      this.pressActive.set(pressInside);
      if (pressInside) this.onPress?.(pointer.id);
      else this.onRelease?.(pointer.id, true);
    }
    this.syncState();
  };

  /**
   * Callback handling pointer end for Button.
   * @property {(pointer: GamePointer) => void} handlePointerEnd
   * @readonly
   * @private
   */
  private readonly handlePointerEnd = (pointer: GamePointer): void => {
    if (this.pressedPointer() !== pointer.id) {
      this.hovered.set(this.contains(pointer));
      this.syncState();
      return;
    }
    const activate = !pointer.cancelled && this.contains(pointer) && !this.pressMoved() && !this.disabled() && !this.blocked();
    this.cancelPress(pointer.cancelled || this.pressMoved());
    this.pressedPointer.set(undefined);
    this.hovered.set(this.contains(pointer));
    this.syncState();
    if (activate) this.onClick();
  };

  /**
   * Checks whether a pointer lies within this object’s interactive bounds.
   * @param {GamePointer} pointer Pointer identifier or normalized pointer data for this interaction.
   * @returns {boolean} a pointer lies within this object’s interactive bounds.
   * @private
   */
  private contains(pointer: GamePointer): boolean {
    if (this.shape === 'circle') {
      const radiusX = this.dimensions.scaledWidth() / 2;
      const radiusY = this.dimensions.scaledHeight() / 2;
      if (radiusX <= 0 || radiusY <= 0) return false;
      const dx = (pointer.x - this.dimensions.getX()) / radiusX;
      const dy = (pointer.y - this.dimensions.getY()) / radiusY;
      return dx * dx + dy * dy <= 1;
    }
    return pointer.x >= this.dimensions.left() && pointer.x <= this.dimensions.right()
      && pointer.y >= this.dimensions.top() && pointer.y <= this.dimensions.bottom();
  }

  /**
   * Releases the active pointer press and clears its transient tracking state.
   * @param {boolean} [cancelled] The cancelled supplied to this operation.
   * @returns {void}
   * @private
   */
  private cancelPress(cancelled = true): void {
    const pointerId = this.pressedPointer();
    if (pointerId !== undefined && this.pressActive()) this.onRelease?.(pointerId, cancelled);
    this.pressActive.set(false);
    this.pressedPointer.set(undefined);
    this.pressOrigin.set(undefined);
    this.pressMoved.set(false);
  }

  /**
   * Selects the button texture state from disabled, blocked, and hover flags.
   * @returns {void}
   * @private
   */
  private syncState(): void {
    const state: TextureStateName = this.disabled() ? 'disabled'
      : this.blocked() ? 'blocked'
        : this.hovered() ? 'hover' : 'idle';
    if (this.state() === state) return;
    this.state.set(state);
    this.texture.setState(state);
  }
}
