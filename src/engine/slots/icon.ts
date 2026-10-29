import { Icon } from './';
import { signalValue, type SignalValue } from 'reactive-values';
import { Atlas, GameLoader } from '../assets';
import { GameContext, MathUtils } from '../core';
import { SpineSprite, Sprite } from '../animations';
import type {
  IconAssetPaths,
  ReelSymbolVisual,
  SpineRecord,
  SpineEventHandler
} from '../interfaces';

/**
 * Defines the spine icon asset contract shared by its consumers.
 * @typedef {SpineIconAsset} SpineIconAsset
 */
type SpineIconAsset = {
  /**
   * Atlas configuration or state owned by SpineIconAsset.
   * @property {Atlas} atlas
   */
  atlas: Atlas;
  /**
   * Snapshot payload persisted by the save service.
   * @property {SpineRecord} data
   */
  data: SpineRecord;
};

/**
 * A reusable slot symbol with optional blurred art and a Spine win animation.
 * @class Icon
 */
export default class implements ReelSymbolVisual {
  /**
   * Reactive win animation active state owned by Icon.
   * @property {SignalValue<boolean>} winAnimationActive
   * @readonly
   * @private
   */
  private readonly winAnimationActive: SignalValue<boolean> = signalValue(false);
  /**
   * Win animation configuration or state owned by Icon.
   * @property {SpineSprite | undefined} winAnimation
   * @private
   */
  private winAnimation: SpineSprite | undefined;
  /**
   * Spine event handlers configuration or state owned by Icon.
   * @property {Map<string, Set<SpineEventHandler>>} spineEventHandlers
   * @readonly
   * @private
   */
  private readonly spineEventHandlers = new Map<string, Set<SpineEventHandler>>();
  /**
   * Remove spine event listeners configuration or state owned by Icon.
   * @property {Set<() => void>} removeSpineEventListeners
   * @readonly
   * @private
   */
  private readonly removeSpineEventListeners = new Set<() => void>();
  /**
   * Id configuration or state owned by Icon.
   * @property {string} id
   * @readonly
   * @public
   */
  public readonly id: string;
  /**
   * Normal configuration or state owned by Icon.
   * @property {Sprite} normal
   * @readonly
   * @private
   */
  private readonly normal: Sprite;
  /**
   * Blurred configuration or state owned by Icon.
   * @property {Sprite} blurred
   * @readonly
   * @private
   */
  private readonly blurred: Sprite;
  /**
   * Spine asset configuration or state owned by Icon.
   * @property {SpineIconAsset | undefined} spineAsset
   * @readonly
   * @private
   */
  private readonly spineAsset?: SpineIconAsset;
  /**
   * Idle aspect ratio configuration or state owned by Icon.
   * @property {number} idleAspectRatio
   * @readonly
   * @private
   */
  private readonly idleAspectRatio: number;

  /**
   * Initializes Icon and its owned resources from the supplied arguments.
   * @constructor
   * @param {string} id The id supplied to this operation.
   * @param {Sprite} normal The normal supplied to this operation.
   * @param {Sprite} blurred The blurred supplied to this operation.
   * @param {SpineIconAsset | undefined} [spineAsset] The spine asset supplied to this operation.
   * @returns {void}
   * @private
   */
  private constructor(
    id: string,
    normal: Sprite,
    blurred: Sprite,
    spineAsset?: SpineIconAsset
  ) {
    this.id = id;
    this.normal = normal;
    this.blurred = blurred;
    this.spineAsset = spineAsset;
    this.idleAspectRatio = normal.dimensions.getWidth() / normal.dimensions.getHeight();
  }

  /**
   * Loads a symbol's normal, blurred, and optional Spine assets.
   * @param {string} id
   * @param {IconAssetPaths} paths
   * @returns {Promise<Icon>}
   * @public
   */
  public static async load(id: string, paths: IconAssetPaths): Promise<Icon> {
    const [normalImage, blurredImage] = await Promise.all([
      GameLoader.loadImageUrl(paths.normal),
      GameLoader.loadImageUrl(paths.blurred)
    ]);
    const spineAsset = paths.spine
      ? await this.loadSpineAsset(id, paths.spine)
      : undefined;
    const idleWidth = normalImage.naturalWidth;
    const idleHeight = normalImage.naturalHeight;
    const idleAspectRatio = idleWidth / idleHeight;
    const blurredAspectRatio = blurredImage.naturalWidth / blurredImage.naturalHeight;
    const blurredSourceWidth = blurredAspectRatio > idleAspectRatio
      ? blurredImage.naturalHeight * idleAspectRatio
      : blurredImage.naturalWidth;
    const blurredSourceHeight = blurredAspectRatio > idleAspectRatio
      ? blurredImage.naturalHeight
      : blurredImage.naturalWidth / idleAspectRatio;
    const blurredSourceX = (blurredImage.naturalWidth - blurredSourceWidth) * 0.5;
    const blurredSourceY = (blurredImage.naturalHeight - blurredSourceHeight) * 0.5;

    return new this(
      id,
      new Sprite(normalImage, idleWidth, idleHeight, 0, 0, 0.5, 0.5),
      new Sprite(
        blurredImage,
        idleWidth,
        idleHeight,
        0,
        0,
        0.5,
        0.5,
        blurredSourceX,
        blurredSourceY,
        blurredSourceWidth,
        blurredSourceHeight
      ),
      spineAsset
    );
  }

  /**
   * Starts the Spine presentation used while this symbol is part of a win.
   * @returns {void}
   * @public
   */
  public activateWinAnimation(): void {
    const animationName = this.getWinAnimationName();
    if (!this.spineAsset || !animationName) return;

    if (!this.winAnimation) {
      this.winAnimation = new SpineSprite(this.spineAsset.data, this.spineAsset.atlas, 0, 0, 0.5, 0.5);
      this.spineEventHandlers.forEach((handlers, name) => {
        handlers.forEach((handler) => {
          const removeListener = this.winAnimation?.onEvent(name, handler);
          if (removeListener) this.removeSpineEventListeners.add(removeListener);
        });
      });
    }
    this.winAnimation.play(animationName);
    this.winAnimationActive.set(true);
    this.advanceWinAnimation(0);
  }

  /**
   * Starts this symbol's win Spine when a reel cell enters its winning state.
   * @param {boolean} isWinning
   * @returns {void}
   * @public
   */
  public setWinning(isWinning: boolean): void {
    if (isWinning) this.activateWinAnimation();
  }

  /**
   * Restores the static presentation before the next reel spin.
   * @returns {void}
   * @public
   */
  public resetWinAnimation(): void {
    this.winAnimationActive.set(false);
  }

  /**
   * Subscribes to a named event in this icon's Spine animations, if available.
   * @param {string} name Name identifying the registered resource.
   * @param {SpineEventHandler} handler
   * @returns {() => void}
   * @public
   */
  public onSpineEvent(name: string, handler: SpineEventHandler): () => void {
    const handlers = this.spineEventHandlers.get(name) ?? new Set<SpineEventHandler>();
    handlers.add(handler);
    this.spineEventHandlers.set(name, handlers);
    const removeFromSprite = this.winAnimation?.onEvent(name, handler);
    const remove = (): void => {
      handlers.delete(handler);
      if (handlers.size === 0) this.spineEventHandlers.delete(name);
      removeFromSprite?.();
      this.removeSpineEventListeners.delete(remove);
    };
    this.removeSpineEventListeners.add(remove);
    return remove;
  }

  /**
   * Advances the icon's active Spine animation, if it has one.
   * @param {number} deltaSeconds Elapsed simulation time in seconds.
   * @returns {void}
   * @public
   */
  public update(deltaSeconds: number): void {
    if (!this.winAnimationActive() || !this.winAnimation) return;
    this.advanceWinAnimation(deltaSeconds);
    if (this.winAnimationActive() && !this.winAnimation.isPlaying) {
      this.winAnimationActive.set(false);
    }
  }

  /**
   * Applies the advance win animation operation to Icon.
   * @param {number} deltaSeconds Elapsed simulation time in seconds.
   * @returns {void}
   * @private
   */
  private advanceWinAnimation(deltaSeconds: number): void {
    if (!this.winAnimation) return;
    try {
      this.winAnimation.update(deltaSeconds);
    } catch (error) {
      // Keep the slot playable if an optional Spine export contains timelines
      // the installed runtime cannot apply. The static facade is always valid.
      this.winAnimationActive.set(false);
      console.warn(`Unable to update the Spine animation for icon "${this.id}".`, error);
    }
  }

  /**
   * Returns win animation name for Icon.
   * @returns {string | undefined} win animation name for Icon.
   * @private
   */
  private getWinAnimationName(): string | undefined {
    const animations = this.spineAsset?.data.animations;
    if (!animations) return undefined;
    if (animations.animation) return 'animation';
    return Object.keys(animations).find((name) =>
      name !== 'idle' && name !== 'static' && name !== 'blurred'
      && name !== 'teaser' && !name.startsWith('to')
    );
  }

  /**
   * Draws the symbol or its active win animation at the supplied cell bounds.
   * @param {number} centerX
   * @param {number} centerY
   * @param {number} width Available width in logical canvas coordinates.
   * @param {number} height Available height in logical canvas coordinates.
   * @param {number} [blurAmount]
   * @param {boolean} [isWinning]
   * @returns {void}
   * @public
   */
  public draw(
    centerX: number,
    centerY: number,
    width: number,
    height: number,
    blurAmount = 0,
    isWinning = false
  ): void {
    const idleHeight = Math.min(height, width / this.idleAspectRatio);
    const idleWidth = idleHeight * this.idleAspectRatio;
    if (blurAmount <= 0 && isWinning && this.winAnimationActive() && this.winAnimation) {
      const context = GameContext.context;
      context.save();
      context.beginPath();
      context.rect(centerX - idleWidth / 2, centerY - idleHeight / 2, idleWidth, idleHeight);
      context.clip();
      this.winAnimation.dimensions.setPosition(centerX, centerY);
      this.winAnimation.dimensions.setSize(idleWidth, idleHeight);
      this.winAnimation.draw();
      context.restore();
      return;
    }
    const amount = MathUtils.clamp(blurAmount, 0, 1);
    const context = GameContext.context;
    context.save();
    const originalAlpha = context.globalAlpha;
    context.beginPath();
    context.rect(centerX - idleWidth / 2, centerY - idleHeight / 2, idleWidth, idleHeight);
    context.clip();
    if (amount < 1) {
      this.normal.dimensions.setPosition(centerX, centerY);
      this.normal.dimensions.setSize(idleWidth, idleHeight);
      context.globalAlpha = originalAlpha * (1 - amount);
      this.normal.draw();
    }
    if (amount > 0) {
      this.blurred.dimensions.setPosition(centerX, centerY);
      this.blurred.dimensions.setSize(idleWidth, idleHeight);
      context.globalAlpha = originalAlpha * amount;
      this.blurred.draw();
    }
    context.restore();
  }

  /**
   * Releases the texture pages owned by this icon's Spine atlas.
   * @returns {void}
   * @public
   */
  public dispose(): void {
    this.winAnimationActive.set(false);
    this.removeSpineEventListeners.forEach((remove) => remove());
    this.removeSpineEventListeners.clear();
    this.spineEventHandlers.clear();
    this.winAnimation = undefined;
  }

  /**
   * Loads spine asset for Icon.
   * @param {string} id The id supplied to this operation.
   * @param {{ json: string; atlas: string; }} paths The paths supplied to this operation.
   * @returns {Promise<SpineIconAsset | undefined>} Loads spine asset for Icon.
   * @private
   */
  private static async loadSpineAsset(
    id: string,
    paths: NonNullable<IconAssetPaths['spine']>
  ): Promise<SpineIconAsset | undefined> {
    try {
      return await GameLoader.loadSpine(paths.json, paths.atlas);
    } catch (error) {
      console.warn(`Unable to load the Spine animation for icon "${id}".`, error);
      return undefined;
    }
  }
}
