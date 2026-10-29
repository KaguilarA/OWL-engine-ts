import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { GameContext, GameInput, GameLoader, PhysicsWorld, type Atlas } from '../../engine';
import { PinballGame, PinballBoard, PinballFlipper, PinballPhysics, PinballBall } from './';

let frame: FrameRequestCallback;
let time = 0;
const games: PinballGame[] = [];

function advance(count = 1): void {
  for (let index = 0; index < count; index++) { time += 1000 / 60; frame(time); }
}

function createGame() {
  const game = new (class extends PinballGame {
    public get world() { return this.worldScene.physics; }
    public get ended() { return this.isGameOver; }
    public restartRun(): void { this.restartGame(); }
  })();
  games.push(game);
  return game;
}

function launch(game: ReturnType<typeof createGame>) {
  GameInput.setPointerAction(70, 'launch', 1);
  advance(10);
  GameInput.setPointerAction(70, 'launch', 0);
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
  vi.spyOn(GameLoader, 'getAtlas').mockReturnValue({ getAnimation: (name: string) => ({
    name, frameRate: 8, loop: true, frames: [{ name, index: 0, x: 0, y: 0, width: 32, height: 32 }]
  }) } as unknown as Atlas);
});

afterEach(() => {
  for (const game of games.splice(0)) game.dispose();
  GameInput.clear();
  vi.restoreAllMocks(); vi.unstubAllGlobals();
});

describe('Pinball scene physics', () => {
  it('keeps the resting ball outside simulation, launches by touch, and exits the shooter through its sensor', () => {
    const game = createGame();
    advance(15);
    expect(game.world.getBodies().filter(body => body.bodyType === 'dynamic')).toHaveLength(0);
    const ball = launch(game);
    expect(ball).toBeDefined();
    expect(ball.velocityY).toBeLessThan(0);
    for (let index = 0; index < 180 && ball.velocityX === 0; index++) advance();
    expect(ball.velocityX).toBeLessThan(-300);
    expect(ball.y).toBeLessThan(new PinballBoard().shooterExitY);
  });

  it('scores bumper and target contacts and applies bumper impulses without manual collision helpers', () => {
    const text = vi.spyOn(GameContext.context, 'fillText');
    const game = createGame();
    const ball = launch(game);
    const board = new PinballBoard();
    const bumper = board.bumpers()[2];
    const radius = ball.bounds().width / 2;
    ball.setPosition(bumper.x, bumper.y + bumper.radius + radius + 1);
    ball.setVelocity(0, -300);
    advance();
    expect(ball.velocityY).toBeGreaterThan(300);
    expect(text.mock.calls.some(([value]) => value === 'SCORE  100')).toBe(true);
    const target = board.targets()[3];
    ball.setPosition(target.x + target.width / 2, target.y + target.height + radius + 1);
    ball.setVelocity(0, -300);
    advance();
    expect(text.mock.calls.some(([value]) => value === 'SCORE  600')).toBe(true);
  });

  it('sweeps both flippers from simultaneous touch actions and kicks an upper contact upward', () => {
    const text = vi.spyOn(GameContext.context, 'fillText');
    const game = createGame();
    const ball = launch(game);
    const samples = game.world.getBodies().filter(body => body.bodyType === 'kinematic');
    const middle = samples[Math.floor(samples.length / 2) - 3];
    const startY = middle.y;
    ball.setPosition(middle.x, middle.y - 12);
    ball.setVelocity(0, 120);
    GameInput.setPointerAction(71, 'moveLeft', 1);
    GameInput.setPointerAction(72, 'moveRight', 1);
    advance(3);
    expect(samples.some(body => body.x < 195 && body.velocityY < 0)).toBe(true);
    expect(samples.some(body => body.x > 195 && body.velocityY < 0)).toBe(true);
    expect(middle.y).toBeLessThan(startY);
    expect(ball.velocityY).toBeLessThan(-300);
    expect(text.mock.calls.some(([value]) => value === 'SCORE  25')).toBe(true);
  });

  it('applies a slingshot kick from a world polygon contact', () => {
    const game = createGame();
    const ball = launch(game);
    const sling = game.world.getBodies().find(body => body.shape.kind === 'polygon')!;
    const [first, second] = sling.vertices();
    const dx = second.x - first.x, dy = second.y - first.y;
    const length = Math.hypot(dx, dy);
    const nx = dy / length, ny = -dx / length;
    ball.setPosition((first.x + second.x) / 2 + nx * 10, (first.y + second.y) / 2 + ny * 10);
    ball.setVelocity(-nx * 300, -ny * 300);
    let impulse: { x: number; y: number } | undefined;
    game.world.onContact(event => {
      if (event.phase === 'begin' && (event.first === sling || event.second === sling)) {
        impulse = { x: ball.velocityX, y: ball.velocityY };
      }
    });
    advance();
    expect(impulse).toBeDefined();
    expect(impulse!.y).toBeLessThan(-300);
    expect(impulse!.x).toBeGreaterThan(100);
  });

  it('drains exactly once per ball, reaches game over, and resets registrations for a new run', () => {
    const game = createGame();
    const originalCount = game.world.getBodies().length;
    for (let life = 0; life < 3; life++) {
      const ball = launch(game);
      const drain = game.world.getBodies().find(body => body.sensor && body.y > 700)!;
      ball.setPosition(drain.x, drain.y - 12);
      ball.setVelocity(0, 1000);
      advance(3);
      expect(game.world.getBodies()).not.toContain(ball);
      expect(game.world.getBodies()).toHaveLength(originalCount);
      expect(game.ended).toBe(life === 2);
    }
    game.restartRun();
    expect(game.ended).toBe(false);
    expect(game.world.getBodies()).toHaveLength(originalCount);
    expect(launch(game)).toBeDefined();
  });

  it('retains a flying ball and score across phone/tablet orientation changes, then releases all hooks on disposal', () => {
    const game = createGame();
    const ball = launch(game);
    const old = game.world.getBodies();
    const count = old.length;
    GameContext.gameDimensionsModel.setSize(844, 390);
    advance();
    const next = game.world.getBodies().find(body => body.bodyType === 'dynamic')!;
    expect(next).toBeDefined();
    expect(next).not.toBe(ball);
    expect(old.every(body => !game.world.getBodies().includes(body))).toBe(true);
    expect(game.world.getBodies().length).toBeGreaterThan(count);
    game.pause();
    const position = next.y;
    advance(5);
    expect(next.y).toBe(position);
    game.resume();
    advance();
    expect(next.y).not.toBe(position);
    const readInput = vi.spyOn(GameInput, 'isDown');
    game.dispose();
    expect(game.world.getBodies()).toHaveLength(0);
    readInput.mockClear();
    game.world.update(0.1);
    expect(readInput).not.toHaveBeenCalled();
    expect(game.world.getBodies()).toHaveLength(0);
    expect(game.world.contacts()).toHaveLength(0);
  });

  it('uses continuous world collisions for thin walls and an entire high-speed drain crossing', () => {
    const world = new PhysicsWorld({ fixedTimeStep: 1 / 120, restitution: 0.8 });
    const board = new PinballBoard();
    const bats = [new PinballFlipper('left'), new PinballFlipper('right')];
    const physics = new PinballPhysics(world, board, bats);
    const ball = new PinballBall(0, 0, board.ballRadius());
    world.addBody(ball.body);
    const wall = board.walls()[3];
    ball.body.setPosition(wall.x - 30, wall.y + wall.height / 2);
    ball.body.setVelocity(100000, 0);
    world.update(1 / 120);
    expect(ball.body.x).toBeLessThan(wall.x - ball.body.radius + 0.01);
    let drains = 0;
    world.onContact(event => { if (event.phase === 'begin' && (event.first === physics.drain() || event.second === physics.drain())) drains++; });
    const drain = physics.drain()!;
    ball.body.setPosition(drain.x, drain.y - 20);
    ball.body.setVelocity(0, 100000);
    world.update(1 / 120);
    expect(drains).toBe(1);
    physics.dispose();
    expect(world.getBodies()).toEqual([ball.body]);
  });
});
