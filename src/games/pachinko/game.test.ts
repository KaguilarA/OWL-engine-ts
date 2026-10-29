import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { GameContext, GameInput, GameLoader, type RigidBody2D } from '../../engine';
import { PachinkoGame, PachinkoBoard } from './';

let frame: FrameRequestCallback;
let time = 0;
const games: PachinkoGame[] = [];

function advance(count = 1): void {
  for (let index = 0; index < count; index++) { time += 1000 / 60; frame(time); }
}

function createGame() {
  const game = new (class extends PachinkoGame {
    public get world() { return this.worldScene.physics; }
    public restartRun(): void { this.restartGame(); }
  })();
  games.push(game);
  return game;
}

function drop(game: ReturnType<typeof createGame>): RigidBody2D {
  GameInput.setPointerAction(91, 'drop', 1);
  advance();
  GameInput.setPointerAction(91, 'drop', 0);
  advance();
  return game.world.getBodies().find(body => body.bodyType === 'dynamic')!;
}

beforeEach(() => {
  time = 0;
  vi.spyOn(performance, 'now').mockImplementation(() => time);
  vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => { frame = callback; return 1; });
  vi.stubGlobal('cancelAnimationFrame', vi.fn());
  GameContext.gameDimensionsModel.setSize(390, 844);
  vi.spyOn(GameLoader, 'getImage').mockReturnValue({ width: 1920, height: 1080 } as HTMLImageElement);
});

afterEach(() => {
  for (const game of games.splice(0)) game.dispose();
  GameInput.clear();
  vi.restoreAllMocks(); vi.unstubAllGlobals();
});

describe('Pachinko scene physics', () => {
  it('runs an actual drop through world contacts and settles exactly one payout', () => {
    const text = vi.spyOn(GameContext.context, 'fillText');
    const game = createGame();
    const ball = drop(game);
    expect(ball).toBeDefined();
    expect(game.world.getBodies().some(body => body.shape.kind === 'polygon')).toBe(true);
    let pegContacts = 0;
    const unsubscribe = game.world.onContact(event => {
      if (event.phase === 'begin' && (event.first === ball || event.second === ball)
        && !event.sensor) pegContacts++;
    });
    for (let index = 0; index < 1800 && game.world.getBodies().includes(ball); index++) advance();
    expect(pegContacts).toBeGreaterThan(0);
    expect(game.world.getBodies()).not.toContain(ball);
    expect(text.mock.calls.some(([value]) => /LANE \d+|EMPTY LANE/.test(String(value)))).toBe(true);
    const credits = text.mock.calls.filter(([value]) => /^CREDITS/.test(String(value))).at(-1)?.[0];
    expect(String(credits)).toMatch(/^CREDITS  (95|100|105|115|135)     BET  5$/);
    const count = game.world.getBodies().length;
    advance(10);
    expect(game.world.getBodies()).toHaveLength(count);
    expect(text.mock.calls.filter(([value]) => /^CREDITS/.test(String(value))).at(-1)?.[0]).toBe(credits);
    unsubscribe();
  });

  it('prevents a fast ball tunneling through thin dividers or crossing a payout sensor twice', () => {
    const text = vi.spyOn(GameContext.context, 'fillText');
    const game = createGame();
    const ball = drop(game);
    const divider = game.world.getBodies().find(body => body.shape.kind === 'polygon')!;
    ball.setPosition(divider.x - 15, divider.y);
    ball.setVelocity(100000, 0);
    advance();
    expect(ball.x).toBeLessThan(divider.bounds().x - ball.bounds().width / 2 + 0.01);
    const sensor = game.world.getBodies().find(body => body.sensor)!;
    const before = game.world.getBodies().length;
    ball.setPosition(sensor.x, sensor.y - 15);
    ball.setVelocity(0, 100000);
    advance();
    expect(game.world.getBodies()).not.toContain(ball);
    expect(game.world.getBodies()).toHaveLength(before - 1);
    const payout = text.mock.calls.filter(([value]) => /^CREDITS/.test(String(value))).at(-1)?.[0];
    expect(payout).toBe('CREDITS  135     BET  5');
    advance(5);
    expect(text.mock.calls.filter(([value]) => /^CREDITS/.test(String(value))).at(-1)?.[0]).toBe(payout);
  });

  it('rebuilds responsive board colliders while retaining an in-flight ball, and cleans up on exit', () => {
    const game = createGame();
    const ball = drop(game);
    const oldBodies = game.world.getBodies().filter(body => body !== ball);
    const count = oldBodies.length;
    GameContext.gameDimensionsModel.setSize(844, 390);
    advance();
    expect(game.world.getBodies()).toContain(ball);
    expect(game.world.getBodies()).toHaveLength(count + 1);
    expect(oldBodies.every(body => !game.world.getBodies().includes(body))).toBe(true);
    const board = new PachinkoBoard();
    expect(ball.x).toBeGreaterThan(board.bounds.x);
    expect(ball.x).toBeLessThan(board.bounds.x + board.bounds.width);
    game.restartRun();
    expect(game.world.getBodies()).toHaveLength(count);
    game.dispose();
    expect(game.world.getBodies()).toHaveLength(0);
    expect(game.world.contacts()).toHaveLength(0);
  });
});
