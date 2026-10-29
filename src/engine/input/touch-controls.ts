import chevronDownSvg from 'lucide-static/icons/chevron-down.svg?raw';
import chevronLeftSvg from 'lucide-static/icons/chevron-left.svg?raw';
import chevronRightSvg from 'lucide-static/icons/chevron-right.svg?raw';
import chevronUpSvg from 'lucide-static/icons/chevron-up.svg?raw';
import crosshairSvg from 'lucide-static/icons/crosshair.svg?raw';

import { GameContext } from '../core';
import type { TouchControlCircle, TouchControlsLayout, TouchControlsOptions } from '../interfaces';
import { CanvasIcon, Texture } from '../rendering';
import { Button } from '../ui';
import { GameEvents, GameInput } from './';

/**
 * Shared directional and fire controls for touch capable phones and tablets.
 * @class TouchControls
 */
export default class {
  /**
   * SVG icons used to draw the four movement directions and fire control.
   * @property {Record<'left' | 'right' | 'up' | 'down' | 'shoot', CanvasIcon>} icons
   * @private
   * @readonly
   */
  private readonly icons = {
    left: new CanvasIcon(chevronLeftSvg),
    right: new CanvasIcon(chevronRightSvg),
    up: new CanvasIcon(chevronUpSvg),
    down: new CanvasIcon(chevronDownSvg),
    shoot: new CanvasIcon(crosshairSvg)
  };
  /**
   * Buttons configuration or state owned by TouchControls.
   * @property {Map<string, Button>} buttons
   * @readonly
   * @private
   */
  private readonly buttons = new Map<string, Button>();
  /**
   * Extra buttons configuration or state owned by TouchControls.
   * @property {Button[]} extraButtons
   * @readonly
   * @private
   */
  private readonly extraButtons: Button[] = [];
  /**
   * Extra button keys configuration or state owned by TouchControls.
   * @property {string[]} extraButtonKeys
   * @private
   */
  private extraButtonKeys: string[] = [];
  /**
   * Stores the show vertical controls state.
   * @property {boolean} showVerticalControls
   * @private
   * @readonly
   */
  private readonly showVerticalControls: boolean;
  /**
   * Primary action configuration or state owned by TouchControls.
   * @property {string} primaryAction
   * @readonly
   * @private
   */
  private readonly primaryAction: string;

  /**
   * Registers touch listeners and configures the visible control layout.
   * @public
   * @return {void}
   * @constructor
   * @param {TouchControlsOptions} [options] Configuration controlling construction or behavior.
   */
  public constructor(options: TouchControlsOptions = {}) {
    this.showVerticalControls = options.showVerticalControls ?? true;
    this.primaryAction = options.primaryAction ?? 'attack';
    ['moveLeft', 'moveRight', 'moveUp', 'moveDown', this.primaryAction].forEach((action) => {
      this.buttons.set(action, this.createActionButton(action));
    });
  }

  /**
   * Returns control positions and the playfield space reserved for them.
   * @public
   * @return {TouchControlsLayout}
   */
  public get layout(): TouchControlsLayout {
    const dimensions = GameContext.gameDimensionsModel;
    const unit = GameContext.viewportUnit();
    const width = dimensions.getWidth();
    const height = dimensions.getHeight();
    const safe = GameContext.safeAreaInsets;
    const usableWidth = Math.max(1, width - safe.left - safe.right);
    const radius = Math.max(
      18,
      Math.min(unit * 0.07, usableWidth * 0.085, 42)
    );
    const margin = Math.max(14, Math.min(width * 0.04, 28));
    const bottomGap = Math.max(18, Math.min(unit * 0.035, 30));
    const directionCenterX = safe.left + Math.max(radius * 2.5 + margin, usableWidth * 0.22);
    const directionCenterY = height - safe.bottom - bottomGap - radius * 2.5;
    const directionOffset = radius * 1.5;
    const left: TouchControlCircle = {
      x: directionCenterX - directionOffset,
      y: directionCenterY,
      radius
    };
    const right: TouchControlCircle = {
      x: directionCenterX + directionOffset,
      y: directionCenterY,
      radius
    };
    const up: TouchControlCircle = {
      x: directionCenterX,
      y: directionCenterY - directionOffset,
      radius
    };
    const down: TouchControlCircle = {
      x: directionCenterX,
      y: directionCenterY + directionOffset,
      radius
    };
    const shoot: TouchControlCircle = {
      x: width - safe.right - margin - radius,
      y: directionCenterY,
      radius
    };
    const visibleControls = [left, right, shoot];
    if (this.showVerticalControls) visibleControls.push(up, down);
    const top = Math.min(
      ...visibleControls.map((control) => control.y - control.radius)
    );

    return {
      left,
      right,
      up,
      down,
      shoot,
      reservedBottom: height - top + 24
    };
  }

  /**
   * Draws enabled movement and fire controls on touch devices.
   * @public
   * @return {void}
   * @param {boolean} [enabled] Whether this component or control accepts updates.
   */
  public draw(enabled = true): void {
    const isMobile = GameContext.isMobileDevice && enabled;
    const layout = this.layout;
    this.syncButton(layout.left, this.buttons.get('moveLeft')!, !isMobile);
    this.syncButton(layout.right, this.buttons.get('moveRight')!, !isMobile);
    this.syncButton(layout.shoot, this.buttons.get(this.primaryAction)!, !isMobile);
    this.syncButton(layout.up, this.buttons.get('moveUp')!, !isMobile || !this.showVerticalControls);
    this.syncButton(layout.down, this.buttons.get('moveDown')!, !isMobile || !this.showVerticalControls);
    this.extraButtons.forEach((button) => button.setDisabled(!isMobile));
    if (!isMobile) return;
    this.drawButton(layout.left, this.icons.left);
    this.drawButton(layout.right, this.icons.right);
    if (this.showVerticalControls) {
      this.drawButton(layout.up, this.icons.up);
      this.drawButton(layout.down, this.icons.down);
    }
    this.drawButton(layout.shoot, this.icons.shoot, 'rgba(156, 62, 69, 0.68)');
  }

  /**
   * Draws a game-specific touch button using the shared button style.
   * @public
   * @return {void}
   * @param {TouchControlCircle} circle Circular hit region in logical canvas coordinates.
   * @param {CanvasIcon} icon The icon supplied to this operation.
   * @param {string} color Color applied when rendering this content.
   * @param {number} [index] Index identifying the item within its collection.
   */
  public drawExtra(circle: TouchControlCircle, icon: CanvasIcon, color: string, index = 0): void {
    if (!GameContext.isMobileDevice) return;
    const button = this.extraButtons[index];
    if (button) this.syncButton(circle, button);
    this.drawButton(circle, icon, `${color}aa`);
  }

  /**
   * Adds game-specific hit regions that map to keyboard-compatible keys.
   * @public
   * @return {void}
   * @param {[TouchControlCircle, string][]} entries The entries supplied to this operation.
   */
  public setExtraKeys(entries: Array<[TouchControlCircle, string]>): void {
    this.setExtras(entries, false);
  }

  /**
   * Game-specific touch controls address actions independently of key bindings.
   * @param {[TouchControlCircle, string][]} entries Touch regions paired with their actions or compatibility keys.
   * @returns {void}
   * @public
   */
  public setExtraActions(entries: Array<[TouchControlCircle, string]>): void {
    this.setExtras(entries, true);
  }

  /**
   * Updates extras for TouchControls.
   * @param {[TouchControlCircle, string][]} entries The entries supplied to this operation.
   * @param {boolean} actions The actions supplied to this operation.
   * @returns {void}
   * @private
   */
  private setExtras(entries: Array<[TouchControlCircle, string]>, actions: boolean): void {
    while (this.extraButtons.length > entries.length) this.extraButtons.pop()!.destroy();
    while (this.extraButtons.length < entries.length) {
      const index = this.extraButtons.length;
      this.extraButtons.push(actions ? this.createActionButton(entries[index][1]) : this.createKeyButton(entries[index][1]));
    }
    entries.forEach(([circle, key], index) => {
      if (this.extraButtonKeys[index] !== `${actions}:${key}`) {
        this.extraButtons[index].destroy();
        this.extraButtons[index] = actions ? this.createActionButton(key) : this.createKeyButton(key);
      }
      this.syncButton(circle, this.extraButtons[index]);
    });
    this.extraButtonKeys = entries.map(([, key]) => `${actions}:${key}`);
  }

  /**
   * Removes pointer listeners and releases any keys still held by pointers.
   * @public
   * @return {void}
   */
  public dispose(): void {
    this.buttons.forEach((button) => button.destroy());
    this.extraButtons.forEach((button) => button.destroy());
    this.buttons.clear();
    this.extraButtons.length = 0;
    this.extraButtonKeys = [];
  }

  /**
   * Constructs key button for TouchControls.
   * @param {string} key Key identifying the associated input or resource.
   * @returns {Button} Constructs key button for TouchControls.
   * @private
   */
  private createKeyButton(key: string): Button {
    return new Button(new Texture({}, 0, 0), {
      shape: 'circle',
      onClick: () => {},
      onPress: (pointerId) => GameEvents.setPointerKey(pointerId, key),
      onRelease: (pointerId) => GameEvents.setPointerKey(pointerId, undefined)
    });
  }

  /**
   * Constructs action button for TouchControls.
   * @param {string} action The action supplied to this operation.
   * @returns {Button} Constructs action button for TouchControls.
   * @private
   */
  private createActionButton(action: string): Button {
    return new Button(new Texture({}, 0, 0), {
      shape: 'circle',
      onClick: () => {},
      onPress: (pointerId) => GameInput.setPointerAction(pointerId, action, 1),
      onRelease: (pointerId, cancelled) => {
        if (cancelled) GameInput.cancelPointerAction(pointerId, action);
        else GameInput.setPointerAction(pointerId, action, 0);
      }
    });
  }

  /**
   * Applies the sync button operation to TouchControls.
   * @param {TouchControlCircle} circle Circular hit region in logical canvas coordinates.
   * @param {Button} button Button whose layout or enabled state is being synchronized.
   * @param {boolean} [disabled] The disabled supplied to this operation.
   * @returns {void}
   * @private
   */
  private syncButton(circle: TouchControlCircle, button: Button, disabled = false): void {
    button.dimensions.setPosition(circle.x, circle.y);
    button.dimensions.setSize(circle.radius * 2, circle.radius * 2);
    button.dimensions.setPivot(0.5, 0.5);
    button.setDisabled(disabled || !GameContext.isMobileDevice);
  }

  /**
   * Draws a shared circular button with its icon and highlight.
   * @private
   * @return {void}
   * @param {TouchControlCircle} circle Circular hit region in logical canvas coordinates.
   * @param {CanvasIcon} icon The icon supplied to this operation.
   * @param {string} [color] Color applied when rendering this content.
   */
  private drawButton(circle: TouchControlCircle, icon: CanvasIcon, color = 'rgba(56, 103, 214, 0.66)'): void {
    const inset1 = Math.max(2, Math.round(circle.radius * 0.16));
    const inset2 = Math.max(4, Math.round(circle.radius * 0.4));
    GameContext.drawCircle(circle.x, circle.y, circle.radius, 'rgba(9, 14, 38, 0.78)');
    GameContext.drawCircle(circle.x, circle.y, Math.max(1, circle.radius - inset1), color);
    GameContext.drawCircle(circle.x, circle.y, Math.max(1, circle.radius - inset2), 'rgba(19, 31, 76, 0.42)');
    GameContext.drawCircle(circle.x - circle.radius * 0.28, circle.y - circle.radius * 0.28, Math.max(1, circle.radius * 0.16), 'rgba(255, 255, 255, 0.35)');
    icon.draw(circle.x - circle.radius * 0.525, circle.y - circle.radius * 0.525, circle.radius * 1.05);
  }

}
