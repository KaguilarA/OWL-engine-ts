import { signalValue } from 'reactive-values';
import type { SceneLifecycleState } from '../interfaces';

/**
 * Accessible loading and failure overlay, independent of a scene's rendering loop.
 * @class SceneTransitionView
 */
export default (class {
  /**
   * Sole transition overlay shared by the application.
   * @property {SceneTransitionView} instance
   */
  public static readonly instance = new this();
  /**
   * Lazily created overlay; removed entirely when a scene becomes active.
   * @property {SignalValue<HTMLDivElement | undefined>} element
   * @private
   */
  private readonly element = signalValue<HTMLDivElement | undefined>(undefined);

  /**
   * Prevents construction of additional transition overlays.
   * @constructor
   * @returns {void}
   * @private
   */
  private constructor() {}

  /**
   * Displays preparation progress or a retryable error without injecting HTML from errors.
   * @param {SceneLifecycleState} state Current manager lifecycle stage.
   * @param {number} progress Completed preparation fraction.
   * @param {Error | undefined} error Failure to display, if any.
   * @param {Function} retry Callback requesting another attempt.
   * @returns {void}
   */
  public render(state: SceneLifecycleState, progress: number, error: Error | undefined, retry: () => void): void {
    if (state === 'idle' || state === 'running' || state === 'paused') {
      this.element()?.remove();
      this.element.set(undefined);
      return;
    }
    let root = this.element();
    if (!root) {
      root = document.createElement('div');
      root.dataset.sceneTransition = '';
      root.setAttribute('role', 'status');
      root.setAttribute('aria-live', 'polite');
      Object.assign(root.style, {
        position: 'fixed', inset: '0', zIndex: '1000', background: '#10172bf5', color: '#ffffff',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        gap: '18px', padding: 'max(24px, env(safe-area-inset-top)) max(24px, env(safe-area-inset-right)) max(24px, env(safe-area-inset-bottom)) max(24px, env(safe-area-inset-left))',
        fontFamily: 'sans-serif', textAlign: 'center'
      });
      root.append(document.createElement('p'), document.createElement('progress'), document.createElement('button'));
      const button = root.querySelector('button')!;
      button.textContent = 'Retry';
      button.hidden = true;
      Object.assign(button.style, { padding: '14px 28px', minHeight: '48px', fontSize: '18px', cursor: 'pointer' });
      document.body.append(root);
      this.element.set(root);
    }
    root.querySelector('p')!.textContent = state === 'error'
      ? `Unable to open scene: ${error?.message ?? 'Unknown error'}`
      : state === 'exiting' ? 'Leaving scene…' : `Loading… ${Math.round(progress * 100)}%`;
    const meter = root.querySelector('progress')!;
    meter.max = 1;
    meter.value = progress;
    meter.hidden = state === 'error';
    meter.setAttribute('aria-label', 'Scene loading progress');
    const button = root.querySelector('button')!;
    const wasHidden = button.hidden;
    button.hidden = state !== 'error';
    button.onclick = retry;
    if (state === 'error' && wasHidden) button.focus();
  }
}).instance;
