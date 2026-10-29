# OWL Engine

A browser-based 2D game engine written in TypeScript and built on Canvas 2D. The engine's public code is organized under `src/engine` and exported from `src/engine/index.ts`.

## Composition

- **Core (`core/`)**: `GameContext` manages the canvas and game-area dimensions. `BaseGame` centralizes lifecycle, updates, pause, restart, shared controls, and cleanup. This module also provides dimensions, in-place `Vector2`, `ObjectPool` and `GamePools` for zero-allocation recycling, `PhysicsBody`, the scene-scoped fixed-step `PhysicsWorld`, collision helpers, health, and math utilities.
- **Scene (`scene/`)**: `SceneManager` coordinates scene loading, entry, pause, exit, retry, and resource disposal; `SceneResources` owns per-instance cleanup. `WorldScene` coordinates the camera and layers; `Camera2D` transforms between world and screen coordinates, follows targets, and supports zoom; `SceneLayer` controls visibility, draw order, parallax, and stable rendering; `Tilemap` renders maps from a tileset; `Container` organizes UI elements.
- **Entities (`entities/`)**: `Entity` combines components with a transform; `Component` defines a functional unit's lifecycle; `SpriteRendererComponent` connects an entity to a drawable; `Prefab` and `PrefabRegistry` create and register reusable configurations. The module also includes entities for common use cases.
- **Assets (`assets/`)**: `GameLoader` loads and caches images, audio, and atlases; `AtlasParser`, `Atlas`, and `AtlasAnimationCatalog` handle regions and animations.
- **Audio (`audio/`)**: `GameAudio` (`AudioManager`) centralizes master, SFX, and BGM volume controls, provides mute toggling, and automatically pauses/resumes audio on window visibility changes.
- **Animation (`animations/`)**: atlas-based animated sprites and a native Spine 2D runtime (`SpineRuntime`, `SpineRenderer`, `SpineSprite`, `SpineBinaryParser`) with animation blending and cross-fading, one-bone and two-bone inverse kinematics (IK) with runtime target aiming, and JSON and compact binary (`.skel`) format support.
- **Particles (`particles/`)**: native, zero-allocation particle engine using contiguous `Float32Array` buffers; `ParticleSystem`, `ParticleEmitter`, and ready-to-use `ParticlePresets` (jackpot coin showers, confetti, sparkles, explosions, sparks).
- **Rendering (`rendering/`)**: textures, canvas icons, and backgrounds.
- **Input (`input/`)**: keyboard and pointer events, reactive semantic actions through `GameInput`, standard-mapped gamepads with analog axes, context-specific bindings, shared controls, and touch controls.
- **UI (`ui/`)**: labels, numeric labels, and buttons.
- **Slots (`slots/`)**: reusable primitives for reels, symbols, icons, and reel animation.
- **Gameplay (`gameplay/`)**: reusable genre primitives for platform and top-down movement, grid boards, turn order, RPG inventories, stats, and quest progress, card decks, projectiles and weapons, weighted outcomes, and in-game casino bankrolls.
- **Interfaces (`interfaces/`)**: contracts and types shared across engine modules.

## Design rules

The authoritative project laws are maintained in [AGENTS.md](AGENTS.md).

1. **Singleton and SOLID:** one responsibility per unit; use a singleton whenever a single instance is appropriate.
2. **One definition per file:** each independent class, interface, function or constant has its own file. Use default exports, except for interfaces, which use named exports. Barrels only re-export.
3. **Reactive values:** reactive state always uses `reactive-values`, without parallel mutable copies or alternative reactive systems.
4. **Multiline JSDoc:** documentation must explain behavior clearly and use the applicable tags, including parameters and return values. Single-line JSDoc is prohibited.
5. **Barrels always:** all local TypeScript imports, including types, tests and dynamic imports, go through `index.ts`. Group imports from the same source.

Every engine interface lives directly in `src/engine/interfaces`, one per file,
and is exported by that directory's barrel. Engine modules must not declare
interfaces alongside implementations or create their own interface directories.

Exported classes and functions are anonymous default declarations. Public names
are assigned only by barrels: `export { default as GameEngine } from './game-engine';`.
Each singleton stays in one implementation file and exports the anonymous class's
`.instance` directly. Do not split its class and instance into separate service
or facade files.

`npm run check:imports` enforces barrel imports during builds;
`npm run check:docs` rejects single-line JSDoc. These checks do not replace review
of responsibilities, reactive state, documentation clarity or file structure.

Every game must be fully playable with touch controls on phones and tablets.
Map every required gameplay action to visible touch buttons or direct board
interaction, support simultaneous movement and actions, and dispose scene-scoped
controls when leaving the game. Keyboard-only gameplay is not sufficient.

## Importing the engine

Engine modules can be imported from the public entry point:

```ts
import {
  BaseGame,
  GameContext,
  GameLoader,
  GameAudio,
  GamePools,
  Vector2,
  ObjectPool,
  ParticleSystem,
  ParticleEmitter,
  ParticlePresets,
  SpineSprite,
  SpineRuntime,
  SpineBinaryParser,
  Camera2D,
  WorldScene,
  SceneLayer,
  Tilemap,
  Entity,
  Component,
  Prefab
} from './engine';
```

Specialized games extend `BaseGame` and implement their update, drawing, restart, and end-state behavior. They can compose their worlds from the engine's scenes, layers, entities, and components.

## Scene lifecycle

`SceneManager` is the shared lifecycle coordinator. Register factories, then
await `goTo(id, data)` to load and enter a fresh scene. The arcade registers `menu`
at startup; the selector registers its games with IDs such as `game:SPACE HUNTERS`.
Activating the currently running scene does not create another instance.

```ts
import { SceneManager } from './engine';
import { GameSelector } from './games';

SceneManager.register('menu', () => new GameSelector());
await SceneManager.goTo('menu');
SceneManager.setPaused(true);
SceneManager.setPaused(false);
await SceneManager.unload();
```

The `GameScene` interface has optional `load(context)`, `enter(context)`, `pause`,
`resume`, `exit`, and `dispose` hooks. All engine interfaces live in
`src/engine/interfaces` and are exported by its barrel. Scenes own their loops;
`BaseGame` and the selector implement suspension and idempotent cleanup. The
manager serializes transitions, suspends the old scene, aborts its cancellation
signal, awaits exit, and attempts all cleanup before creating the next scene.
It never runs a second update loop for a scene. Async scene loading must return
its promise through `load`, rather than launch detached constructor work.

`state`, `progress`, and `error` are reactive values. States are `idle`, `loading`,
`entering`, `running`, `paused`, `exiting`, and `error`. A DOM overlay displays
loading progress and an accessible Retry button on failure. `goTo` returns false
for preparation or cleanup failures; unknown IDs reject without disturbing the
active scene. `retry()` repeats the failed request. Concurrent requests are queued,
not overlapped. A loading hook must settle for the next queued transition to run.

Each factory and loading hook receives `SceneLoadContext`: detached transition
`data`, a cancellation `signal`, `reportProgress(0..1)`, and a `resources` scope.
Register owned cleanup through `context.resources.own(() => resource.dispose())`.
Cleanup runs once in reverse acquisition order, including on failed entry, and
attempts every callback even if one throws. Factories that acquire resources
before returning should immediately register their cleanup in this scope.
`GameLoader` owns shared asset caches; do not register those caches as scene-owned
resources. `BaseGame` also releases registered game callbacks, controls, scheduled
frames, world references, and physics registrations when disposed.

Use `setSessionData(key, snapshot)` and `getSessionData(key)` for detached JSON
progress that survives scene changes and unload. `clearSession()` explicitly
starts a new session. Session data is in memory; use `GameSaves` explicitly to
persist it. Automatic world serialization belongs to a later roadmap phase.

## Input actions

Games read actions through the shared `GameInput` singleton instead of checking
physical keys. `BaseGame` and the selector call `GameInput.update()` once before
each frame update, including paused frames. Other consumers of the same frame
must not call it again, because that advances the action edges.

```ts
import { GameInput, TouchControls } from './engine';

const horizontal = GameInput.axis('moveX'); // -1..1; moveY is down-positive
const fireHeld = GameInput.isDown('attack');
const jumpStarted = GameInput.wasPressed('jump');
const launchReleased = GameInput.wasReleased('launch');

GameInput.rebind('attack', { keys: ['q'], buttons: [2] }, 'gameplay');
const saved = GameInput.savePreferences(); // Check saved.ok before reporting success.
// Preferences are restored by the selector; independent apps call loadPreferences().

const touch = new TouchControls({ showVerticalControls: false, primaryAction: 'jump' });
// Call touch.draw() during rendering, and touch.dispose() when the scene closes.
```

`state(action)` returns `{ value, down, pressed, released }`. Edges are shared by
all consumers and are not consumed by reading. Quick keyboard and touch taps
between frames are retained for one sample. Independent pointers and hardware
sources can hold actions simultaneously. Touch buttons address actions directly,
so changing keyboard bindings does not change the touch controls.

Defaults include movement, `attack`, `jump`, `dash`, `polarity`, `interact`,
`launch`, `spin`, `drop`, `confirm`, `back`, and `pause`. The `moonfall` profile
separates jump (Space/gamepad A) from attack (Z/gamepad X). `menu` and `editor`
contain navigation, confirmation and back actions. Games start with
`this.start()` or `this.start('moonfall')`; custom applications can use
`registerContext(name, bindings)` and `activateContext(name)`.

Standard-mapped gamepads use the left stick or D-pad for movement. The default
stick deadzone is 0.18; values above it are rescaled to preserve analog movement.
Gameplay pause uses P/Escape or Start (button 9); return to the selector uses
Backspace or Select (button 8). Pinball's launch action charges while held and
launches on release for keyboard, touch and gamepad alike. Devices without the
standard mapping require explicit adapter support.

`getBindings(context)` returns a detached copy. `rebind`, `resetBindings`,
`savePreferences` and `loadPreferences` provide the configuration API; a player
settings screen is still pending. Context switches clear virtual controls and
block hardware already held until it is released. Blur, visibility changes,
pointer cancellation, capture loss and control disposal release transient input.
Shared controls respect CSS safe-area insets and recalculate layout after rotation.
Direct board interactions still use `GameEvents` pointer subscriptions.
Applications using only the low-level event API call `GameEvents.initEvents()`
explicitly; activating `GameInput` initializes those listeners automatically.

See [the roadmap](README.roadmap.md) for implementation status and remaining
device and gamepad validation.

## Saving games

`GameSaves` is the shared persistence service, backed by browser `localStorage`.
Use a stable game ID and optional slot (defaults to `default`). Each game defines
its JSON snapshot and a validator; save plain values, then explicitly restore them
into signals and entities when loading.

```ts
import { GameSaves } from './engine';

type Progress = { level: number };
const isProgress = (data: unknown): data is Progress =>
  typeof data === 'object' && data !== null &&
  Number.isInteger((data as Progress).level) && (data as Progress).level > 0;

const saved = GameSaves.save('my-game', { level: 3 }, 1, 'slot-1');
const loaded = GameSaves.load('my-game', isProgress, 1, 'slot-1');
if (loaded.ok) {
  const level = loaded.value.data.level;
  // Apply level to the game's state here.
}
GameSaves.remove('my-game', 'slot-1');
```

Results have `ok` and either `value` or `reason`: `missing`, `unavailable`,
`invalid`, or `version`. Saves include an ISO timestamp and schema version.
Increment the version when changing the snapshot format; incompatible saves are
preserved so the game can handle migration explicitly. Storage failures (including
quota limits) return `unavailable`. Non-JSON values and cycles return `invalid`.
An optional final `SaveStorage` argument supports tests or other synchronous
storage adapters. Saving is explicit; games decide when to save and restore,
and provide their own controls or autosave policy. Browser saves belong to the
current origin and browser profile.
