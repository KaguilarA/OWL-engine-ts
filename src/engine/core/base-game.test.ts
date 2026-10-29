import { afterEach, describe, expect, it, vi } from 'vitest';
import { signalValue } from 'reactive-values';
import { BaseGame } from './';
import { GameInput } from '../input';

/**
 * Minimal game exercising the real engine lifecycle and action router.
 * @class InputTestGame
 */
class InputTestGame extends BaseGame {
  public readonly attacks = signalValue(0);
  public readonly restarts = signalValue(0);
  public readonly ended = signalValue(false);
  public constructor(onMenu: () => void) { super(onMenu); this.start('moonfall'); }
  protected updateGame(): void {
    if (GameInput.wasPressed('attack')) this.attacks.set(this.attacks() + 1);
  }
  protected drawGame(): void {}
  protected restartGame(): void { this.restarts.set(this.restarts() + 1); this.ended.set(false); }
  protected get isGameOver(): boolean { return this.ended(); }
}

afterEach(() => { GameInput.clear(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });

describe('BaseGame input lifecycle', () => {
  it('samples actions, pauses, restarts after game over, and releases input when leaving', () => {
    let frame: FrameRequestCallback = () => {};
    vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => { frame = callback; return 1; });
    vi.stubGlobal('cancelAnimationFrame', vi.fn());
    const menu = vi.fn();
    const game = new InputTestGame(menu);
    const press = (key: string) => window.dispatchEvent(new KeyboardEvent('keydown', { key }));
    const release = (key: string) => window.dispatchEvent(new KeyboardEvent('keyup', { key }));
    press('z'); frame(16);
    expect(game.attacks()).toBe(1);
    frame(32);
    expect(game.attacks()).toBe(1);
    release('z'); press('p'); frame(48);
    release('p'); frame(64);
    press('z'); frame(80);
    expect(game.attacks()).toBe(1);
    release('z'); press('p'); frame(96);
    release('p'); release('z'); frame(112);
    press('z'); frame(128);
    expect(game.attacks()).toBe(2);
    release('z'); game.ended.set(true); press('Enter'); frame(144);
    expect(game.restarts()).toBe(1);
    release('Enter'); press('Backspace'); frame(160);
    expect(menu).toHaveBeenCalledOnce();
    expect(GameInput.isDown('back')).toBe(false);
    frame(176);
    expect(menu).toHaveBeenCalledOnce();
  });
});
