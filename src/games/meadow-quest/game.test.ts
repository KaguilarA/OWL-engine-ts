import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { GameContext, GameInput, GameLoader, type Atlas } from '../../engine';
import { MeadowQuestGame, PlatformerRenderer } from './';

let frame: FrameRequestCallback;
let time = 0;
const games: MeadowQuestGame[] = [];

function advance(count = 1): void {
  for (let index = 0; index < count; index++) { time += 1000 / 60; frame(time); }
}

function createGame() {
  const game = new (class extends MeadowQuestGame {
    public get physics() { return this.worldScene.physics; }
    public restartRun(): void { this.restartGame(); }
  })();
  games.push(game);
  return game;
}

beforeEach(() => {
  time = 0;
  vi.spyOn(performance, 'now').mockImplementation(() => time);
  vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => { frame = callback; return 1; });
  vi.stubGlobal('cancelAnimationFrame', vi.fn());
  GameContext.gameDimensionsModel.setSize(390, 844);
  const image = { width: 1920, height: 1080 } as HTMLImageElement;
  vi.spyOn(GameLoader, 'getImage').mockReturnValue(image);
  vi.spyOn(GameLoader, 'getAtlas').mockReturnValue({ getAnimation: (name: string) => ({
    name, frameRate: 8, loop: true, frames: [{ name, index: 0, x: 0, y: 0, width: 32, height: 32 }]
  }) } as unknown as Atlas);
});

afterEach(() => {
  for (const game of games.splice(0)) game.dispose();
  GameInput.clear();
  vi.restoreAllMocks(); vi.unstubAllGlobals();
});

describe('Meadow Quest scene physics', () => {
  it('moves and jumps from simultaneous touch actions with gravity integrated once', () => {
    const game = createGame();
    const player = game.physics.getBodies().find(body => body.bodyType === 'dynamic')!;
    const startX = player.x, startY = player.y;
    GameInput.setPointerAction(81, 'moveRight', 1);
    advance(6);
    expect(player.x - startX).toBeCloseTo(26);
    expect(player.y).toBeCloseTo(startY);
    GameInput.setPointerAction(82, 'jump', 1);
    advance();
    expect(player.velocityY).toBeCloseTo(-460);
    expect(player.y).toBeLessThan(startY);
    expect(player.velocityX).toBe(260);
    GameInput.setPointerAction(81, 'moveRight', 0);
    GameInput.setPointerAction(82, 'jump', 0);
    advance(75);
    expect(player.y).toBeCloseTo(startY);
    expect(player.velocityY).toBeCloseTo(0);
  });

  it('passes upward through a ledge and lands on its upper face', () => {
    const game = createGame();
    const player = game.physics.getBodies().find(body => body.bodyType === 'dynamic')!;
    const ledge = game.physics.getBodies().find(body => body.oneWay)!;
    player.setPosition(ledge.x, ledge.bounds().y + player.bounds().height / 2 + 2);
    player.setVelocity(0, -400);
    advance(12);
    expect(player.bounds().y + player.bounds().height).toBeLessThan(ledge.bounds().y);
    advance(45);
    expect(player.bounds().y + player.bounds().height).toBeCloseTo(ledge.bounds().y);
    expect(player.velocityY).toBeCloseTo(0);
  });

  it('collects sensor coins once and wins only after entering the goal', () => {
    const draw = vi.spyOn(PlatformerRenderer.prototype, 'draw');
    const game = createGame();
    const player = game.physics.getBodies().find(body => body.bodyType === 'dynamic')!;
    const coin = game.physics.getBodies().find(body => body.sensor && body.bodyType === 'static' && body.shape.kind === 'circle')!;
    player.setPosition(coin.x, coin.y);
    advance();
    expect(draw.mock.lastCall![0].score).toBe(50);
    expect(draw.mock.lastCall![0].coins[0].collected()).toBe(true);
    expect(game.physics.getBodies()).not.toContain(coin);
    advance(3);
    expect(draw.mock.lastCall![0].score).toBe(50);
    const goal = game.physics.getBodies().find(body => body.sensor && body.shape.kind === 'box')!;
    player.setPosition(goal.x, 844 * 0.79 - player.bounds().height / 2);
    advance();
    expect(draw.mock.lastCall![0].won).toBe(true);
  });

  it('preserves progress across orientation changes and releases old terrain on restart and disposal', () => {
    const draw = vi.spyOn(PlatformerRenderer.prototype, 'draw');
    const game = createGame();
    const player = game.physics.getBodies().find(body => body.bodyType === 'dynamic')!;
    const coin = game.physics.getBodies().find(body => body.sensor && body.shape.kind === 'circle' && body.bodyType === 'static')!;
    player.setPosition(coin.x, coin.y);
    advance();
    const oldBodies = game.physics.getBodies();
    const oldMap = draw.mock.lastCall![0].terrain;
    GameContext.gameDimensionsModel.setSize(844, 390);
    advance();
    expect(draw.mock.lastCall![0].score).toBe(50);
    expect(draw.mock.lastCall![0].coins[0].collected()).toBe(true);
    expect(oldBodies.every(body => !game.physics.getBodies().includes(body))).toBe(true);
    const count = game.physics.getBodies().length;
    oldMap.fill(0); oldMap.fill(1);
    expect(game.physics.getBodies()).toHaveLength(count);
    game.restartRun();
    advance();
    expect(draw.mock.lastCall![0].score).toBe(0);
    expect(game.physics.getBodies()).toHaveLength(count + 1);
    const map = draw.mock.lastCall![0].terrain;
    game.dispose();
    map.fill(0); map.fill(1);
    expect(game.physics.getBodies()).toHaveLength(0);
    expect(game.physics.contacts()).toHaveLength(0);
  });
});
