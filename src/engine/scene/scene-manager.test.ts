import { afterEach, describe, expect, it, vi } from 'vitest';
import { SceneManager, SceneResources } from './';
import type { GameScene, SceneLoadContext } from '../interfaces';

const ids: string[] = [];

function register(id: string, factory: (context: SceneLoadContext) => GameScene | Promise<GameScene>): void {
  SceneManager.register(id, factory);
  ids.push(id);
}

afterEach(async () => {
  await SceneManager.unload();
  for (const id of ids.splice(0)) SceneManager.unregister(id);
  SceneManager.clearSession();
  vi.restoreAllMocks();
});

describe('SceneManager', () => {
  it('orders loading, entry, pause, exit and cleanup across repeated menu/level/results transitions', async () => {
    const events: string[] = [];
    let liveResources = 0;
    for (const id of ['menu', 'level', 'results']) {
      register(id, context => {
        events.push(`create:${id}`);
        liveResources++;
        context.resources.own(() => { events.push(`release:${id}`); liveResources--; });
        return {
          load: () => { events.push(`load:${id}`); context.reportProgress(0.5); },
          enter: () => { events.push(`enter:${id}`); },
          resume: () => { events.push(`resume:${id}`); },
          pause: () => { events.push(`pause:${id}`); },
          exit: () => { events.push(`exit:${id}`); },
          dispose: () => { events.push(`dispose:${id}`); }
        };
      });
    }
    for (let cycle = 0; cycle < 3; cycle++) {
      for (const id of ['menu', 'level', 'results']) {
        expect(await SceneManager.goTo(id)).toBe(true);
        expect(SceneManager.activeId).toBe(id);
        expect(SceneManager.state()).toBe('running');
        expect(liveResources).toBe(1);
        expect(document.querySelector('[data-scene-transition]')).toBeNull();
      }
    }
    expect(events.indexOf('load:menu')).toBeLessThan(events.indexOf('enter:menu'));
    expect(events.indexOf('exit:menu')).toBeLessThan(events.indexOf('release:menu'));
    expect(events.indexOf('release:menu')).toBeLessThan(events.indexOf('create:level'));
    await SceneManager.unload();
    expect(liveResources).toBe(0);
    expect(SceneManager.state()).toBe('idle');
  });

  it('serializes concurrent requests and does not duplicate an already active scene', async () => {
    const order: string[] = [];
    const create = vi.fn(() => ({ enter: () => { order.push('enter:first'); } }));
    register('first', create);
    register('second', () => { order.push('create:second'); return {}; });
    expect(await SceneManager.goTo('first')).toBe(true);
    expect(await SceneManager.goTo('first')).toBe(true);
    expect(create).toHaveBeenCalledOnce();
    await SceneManager.unload();
    const first = SceneManager.goTo('first');
    expect(() => SceneManager.unregister('first')).toThrow();
    const second = SceneManager.goTo('second');
    expect(await first).toBe(true);
    expect(await second).toBe(true);
    expect(SceneManager.activeId).toBe('second');
    expect(order.indexOf('enter:first')).toBeLessThan(order.indexOf('create:second'));
  });

  it('reports monotonic loading progress and ignores a released scene reporter', async () => {
    let scope!: SceneLoadContext;
    let finish!: () => void;
    const pending = new Promise<void>(resolve => { finish = resolve; });
    register('loading', context => {
      scope = context;
      return { load: () => pending };
    });
    const transition = SceneManager.goTo('loading', { checkpoint: 2 });
    await vi.waitFor(() => expect(scope).toBeDefined());
    scope.reportProgress(0.75);
    scope.reportProgress(0.2);
    scope.reportProgress(NaN);
    expect(SceneManager.progress()).toBe(0.75);
    expect(document.querySelector('progress')?.value).toBe(0.75);
    expect(scope.data).toEqual({ checkpoint: 2 });
    finish();
    expect(await transition).toBe(true);
    await SceneManager.unload();
    expect(scope.signal.aborted).toBe(true);
    scope.reportProgress(1);
    expect(SceneManager.progress()).toBe(0);
  });

  it('disposes partial preparation on failure and retries through the visible touch button', async () => {
    let attempts = 0;
    let live = 0;
    register('retry', context => {
      live++;
      context.resources.own(() => { live--; });
      return {
        load: async () => { if (++attempts === 1) throw new Error('Missing level texture'); }
      };
    });
    expect(await SceneManager.goTo('retry')).toBe(false);
    expect(live).toBe(0);
    expect(SceneManager.activeScene).toBeUndefined();
    expect(SceneManager.state()).toBe('error');
    expect(document.body.textContent).toContain('Missing level texture');
    const retry = document.querySelector<HTMLButtonElement>('[data-scene-transition] button')!;
    expect(retry.hidden).toBe(false);
    retry.click();
    await vi.waitFor(() => expect(SceneManager.state()).toBe('running'));
    expect(live).toBe(1);
    expect(attempts).toBe(2);
  });

  it('cleans the factory scope when construction fails and exits partially entered scenes', async () => {
    const release = vi.fn();
    register('factory-error', context => {
      context.resources.own(release);
      throw new Error('Cannot construct scene');
    });
    expect(await SceneManager.goTo('factory-error')).toBe(false);
    expect(release).toHaveBeenCalledOnce();
    const exit = vi.fn();
    const dispose = vi.fn();
    register('entry-error', () => ({ enter: () => { throw new Error('Cannot enter'); }, exit, dispose }));
    expect(await SceneManager.goTo('entry-error')).toBe(false);
    expect(exit).toHaveBeenCalledOnce();
    expect(dispose).toHaveBeenCalledOnce();
  });

  it('attempts all cleanup after a hook failure and allows recovery without retaining the old scene', async () => {
    const resource = vi.fn();
    const dispose = vi.fn();
    register('broken-exit', context => {
      context.resources.own(resource);
      return { exit: () => { throw new Error('exit failed'); }, dispose };
    });
    register('recovered', () => ({}));
    await SceneManager.goTo('broken-exit');
    expect(await SceneManager.goTo('recovered')).toBe(false);
    expect(resource).toHaveBeenCalledOnce();
    expect(dispose).toHaveBeenCalledOnce();
    expect(SceneManager.activeScene).toBeUndefined();
    expect(await SceneManager.retry()).toBe(true);
    expect(SceneManager.activeId).toBe('recovered');
  });

  it('retains detached session progress and owns pause state across scene changes', async () => {
    const pause = vi.fn();
    const resume = vi.fn();
    register('a', () => ({ pause, resume }));
    register('b', () => ({}));
    const snapshot = { level: 3 };
    SceneManager.setSessionData('campaign', snapshot);
    snapshot.level = 99;
    await SceneManager.goTo('a');
    SceneManager.setPaused(true);
    expect(SceneManager.state()).toBe('paused');
    const calls = pause.mock.calls.length;
    SceneManager.setPaused(true);
    expect(pause).toHaveBeenCalledTimes(calls);
    SceneManager.setPaused(false);
    expect(SceneManager.state()).toBe('running');
    await SceneManager.goTo('b');
    expect(SceneManager.getSessionData('campaign')).toEqual({ level: 3 });
    const copy = SceneManager.getSessionData('campaign') as { level: number };
    copy.level = 7;
    expect(SceneManager.getSessionData('campaign')).toEqual({ level: 3 });
  });

  it('rejects unknown, duplicate, and active registrations without disturbing the current scene', async () => {
    register('valid', () => ({}));
    expect(() => SceneManager.register('valid', () => ({}))).toThrow();
    await expect(SceneManager.goTo('missing')).rejects.toThrow('Unknown scene');
    await SceneManager.goTo('valid');
    expect(() => SceneManager.unregister('valid')).toThrow();
    expect(SceneManager.activeId).toBe('valid');
  });
});

describe('SceneResources', () => {
  it('releases in reverse order exactly once even if a callback throws', async () => {
    const scope = new SceneResources();
    const calls: number[] = [];
    scope.own(() => { calls.push(1); });
    scope.own(() => { calls.push(2); throw new Error('failed'); });
    scope.own(async () => { calls.push(3); });
    const first = scope.dispose();
    expect(scope.dispose()).toBe(first);
    await expect(first).rejects.toThrow('Scene resource cleanup failed');
    expect(calls).toEqual([3, 2, 1]);
    expect(() => scope.own(() => {})).toThrow('already disposed');
  });
});
