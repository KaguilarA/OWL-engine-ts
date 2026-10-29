# OWL Engine — Roadmap

Goal: evolve the JavaScript/TypeScript engine into a complete tool for creating,
editing, testing, and publishing 2D games. Unreal serves as a workflow reference;
this project remains focused on 2D games and the web.

This document tracks planned work. Checkboxes are marked only when functionality
is implemented and verified. Phases indicate the recommended order, not dates or
delivery commitments.

## Mandatory Rules

The five laws are maintained in [AGENTS.md](AGENTS.md):

1. Singleton and SOLID: one responsibility per unit and a single instance when appropriate.
2. One independent definition per file; default exports except for interfaces.
3. Reactive state always uses `reactive-values`.
4. Clear, multiline JSDoc with parameter and return tags.
5. Local imports always use barrels, grouped by source.

- Every game must be fully playable with touch controls on phones and tablets,
  including every action required to progress.
- Preserve keyboard controls and support simultaneous inputs.
- Validate layout and interaction in portrait and landscape orientations.
- Release input, listeners, and resources when closing a scene or game.
- Every new capability must include appropriate documentation and verification.

## Existing Foundation

The engine already provides the following foundations; their presence does not
mean they are complete for a visual editing workflow:

- Game lifecycle, pause, restart, and selector navigation through `BaseGame`.
- Scenes, layers, a 2D camera, containers, and tilemaps.
- Entities, components, transforms, and prefabs implemented as code factories.
- Image, audio, and atlas loading.
- Sprite animation, a Spine runtime, and particles.
- Audio with volume controls and visibility-based pausing.
- Keyboard and pointer input, and shared touch controls.
- Collision primitives and a fixed-step physics world centered on circles.
- Reusable movement and gameplay primitives.
- A JSON save service with per-game slots, versioning, and validation.

The current save service does not automatically serialize scenes, entities, or
components. Current prefabs are not yet documents editable through an inspector.

## Phase 1 — Scenes and Components Defined as Data

Main priority: establish the format shared by the runtime and editor.

- [ ] Define a project document containing configuration, the initial scene, and assets.
- [ ] Define a versioned scene format independent of in-memory objects.
- [ ] Assign persistent identifiers to entities, components, and resources.
- [ ] Create a component type registry and reconstruction factories.
- [ ] Declare editable properties with types, defaults, and validation.
- [ ] Serialize and reconstruct entities, components, layers, and the camera.
- [ ] Resolve object references after reconstructing their instances.
- [ ] Add entity hierarchies and local and global transforms.
- [ ] Define migrations for documents from earlier versions.
- [ ] Report reference, type, and property errors without losing the document.

**Completion criterion:** save a scene, reload it, and recover its objects,
properties, and references without writing code specific to that level.

## Phase 2 — Scene Lifecycle Management

- [x] Create a shared manager to register, load, activate, and unload scenes.
- [x] Define loading, entry, running, pause, and exit states.
- [x] Separate scene-owned resources from shared resources.
- [x] Add loading screens, progress, errors, and retry handling.
- [x] Support transitions between menus, levels, and results.
- [x] Define how progress is preserved across scene changes.
- [x] Verify that repeated entry and exit do not duplicate listeners or entities.

Implemented through the `SceneManager` singleton, the `GameScene` lifecycle
contract, and per-instance `SceneResources`. The arcade now starts through a
registered menu scene, loads shared assets before displaying the selector, and
switches between registered game scenes and fresh menu instances. Existing game
results remain inside each game's scene; standalone results scenes can use the
same registration API. Loading failures release partial resources and expose an
accessible Retry button. Session progress is explicitly retained through
`setSessionData` and `getSessionData`; persistent game-state restoration remains
part of phase 9. Automated tests cover repeated real selector/game transitions,
single-loop ownership, subscription counts, failure cleanup, retries, and queued
menu/level/results lifecycle ordering. Physical-device validation remains in phase 3.

**Completion criterion:** go through the menu, level, and results, return to the
menu, and repeat without stuck controls or resources left over from earlier scenes.

## Phase 3 — Input Actions and Device Compatibility

- [x] Define actions such as `move`, `jump`, `attack`, `dash`, `interact`, and `pause`.
- [x] Support digital actions and analog axes.
- [x] Map keyboard, pointer, touch, and gamepad input to those actions.
- [x] Expose pressed, held, and released states.
- [x] Support rebinding and preference persistence through an API.
- [x] Separate menu and gameplay input contexts and provide editor context registration.
- [x] Add touch controls configurable by game and action.
- [x] Adapt size, position, and safe areas to phones and tablets.
- [x] Handle multitouch, pointer cancellation, and focus loss.
- [x] Migrate existing games so they no longer depend on specific keys.
- [ ] Add a settings screen for rebinding controls and restoring defaults.
- [ ] Verify every game on physical phones and tablets.
- [ ] Validate complete gamepad playthroughs and finish navigation for board-based games.

The foundation is implemented in `GameInput`: reactive actions, `gameplay`,
`moonfall`, `menu`, and `editor` profiles, per-context rebinding, and versioned
preferences through `GameSaves`. The selector and `BaseGame` sample input once
per frame. Board-based games retain direct pointer interaction; removing specific
key checks does not replace validation of each game on every device. The future
editor's input context is available as an API; its interface belongs to phase 4.

**Completion criterion:** play an entire level without a keyboard, move and act
simultaneously, and use the same gameplay behavior through keyboard and gamepad.

## Phase 4 — Minimal Visual Editor

Depends on the scene format and component registry from phase 1.

- [ ] Separate the editor from the runtime exported with games.
- [ ] Create a level viewport with panning and zoom.
- [ ] Show an entity and layer tree with selection and search.
- [ ] Create an inspector driven by editable-property metadata.
- [ ] Add and remove entities and components through the editor.
- [ ] Move, rotate, and scale objects using visual tools.
- [ ] Add a grid, snapping, and object duplication.
- [ ] Implement reversible commands for undo and redo.
- [ ] Save, open, and recover documents with pending changes.
- [ ] Add play, pause, single-step, and stop controls.
- [ ] Keep editing state separate from temporary gameplay state.

**Completion criterion:** build and save a simple level in the editor, test it,
and stop playback while restoring the original editing state.

## Phase 5 — Assets, Prefabs, and Maps

- [ ] Create an asset browser with search, folders, and previews.
- [ ] Introduce a catalog with resource identifiers and dependencies.
- [ ] Define import, reimport, and configuration workflows for each asset type.
- [ ] Detect broken references when moving, renaming, or deleting content.
- [ ] Add per-scene resource loading and unloading.
- [ ] Turn prefabs into serializable, editable documents.
- [ ] Support per-instance overrides and updates from the original prefab.
- [ ] Import maps from an external tool such as Tiled or LDtk.
- [ ] Edit tilemaps with brushes, erasing, filling, and layers.
- [ ] Configure collisions, spawn points, and tile and object properties.
- [ ] Optimize large maps through regions and off-camera culling.

**Completion criterion:** import content, create a prefab, reuse it in several
scenes, and update it while preserving explicit per-instance overrides.

## Phase 6 — Physics and World Queries

- [ ] Expand supported shapes with boxes and convex polygons.
- [ ] Define static, dynamic, and kinematic bodies.
- [ ] Add sensors and contact begin, stay, and end events.
- [ ] Add collision layers and masks.
- [ ] Expose point, area, and ray queries.
- [ ] Add a broad phase to reduce the number of collision pairs evaluated.
- [ ] Prevent fast-moving objects from passing through obstacles.
- [ ] Integrate tilemap collisions and one-way platforms.
- [ ] Add tools to visualize bodies, contacts, and queries.
- [ ] Evaluate constraints and joints when games require them.

**Completion criterion:** build a scene with terrain, obstacles, sensors, and
moving objects without implementing a separate collision system for every game.

## Phase 7 — Animation and Behavior

- [ ] Create reusable state machines for characters and objects.
- [ ] Add an animation controller with parameters and transitions.
- [ ] Emit animation events for sound, impacts, and effects.
- [ ] Implement tweens and a timeline for sequences.
- [ ] Coordinate camera, animation, audio, and events through sequences.
- [ ] Add reusable AI foundations: perception, decisions, and 2D navigation.
- [ ] Define behavior contracts that a node editor can consume.
- [ ] Create basic visual scripting with events, conditions, actions, and variables.
- [ ] Validate graphs and allow inspection of their execution.

**Completion criterion:** configure a character with idle, movement, jump,
attack, and damage behavior through data and reusable components. Build visual
scripting after stabilizing these contracts.

## Phase 8 — Production UI and Audio

- [ ] Expand UI with panels, lists, bars, input fields, and selection controls.
- [ ] Define anchors, layout, scaling, themes, and safe areas.
- [ ] Manage focus and navigation through keyboard, touch, and gamepad.
- [ ] Add localization and support for texts of different lengths.
- [ ] Add visual tools for building menus and HUDs.
- [ ] Expand audio with mixer groups, fades, and simultaneous voice limits.
- [ ] Add 2D positional audio and reusable sound events.
- [ ] Persist audio, control, and accessibility preferences.

**Completion criterion:** reuse menus and HUDs across games and devices without
manually recalculating every position.

## Phase 9 — Integrated Saving

- [ ] Define persistent and temporary state for each component.
- [ ] Integrate progress, the current scene, and persistent entities with `GameSaves`.
- [ ] Add checkpoints and a configurable autosave policy.
- [ ] Show slots, dates, errors, and options to continue or start a new game.
- [ ] Implement game-state migrations with compatibility tests.
- [ ] Support validated save exports and imports.
- [ ] Evaluate asynchronous storage for saves beyond the scope of small JSON payloads.

**Completion criterion:** close the game, reopen it, and resume with the correct
scene, progress, and persistent state, including after a supported migration.

## Phase 10 — Diagnostics and Performance

- [ ] Add a panel showing FPS, frame duration, and time spent per system.
- [ ] Show counts of entities, bodies, particles, and loaded resources.
- [ ] Add a console with errors linked to scenes and objects.
- [ ] Visualize bounds, pivots, collisions, cameras, and touch regions.
- [ ] Create benchmark scenes for desktop and mobile performance measurements.
- [ ] Establish measured loading, memory, and frame-time budgets.
- [ ] Define a rendering contract independent of Canvas 2D.
- [ ] Evaluate and introduce WebGL when measurements justify the change.
- [ ] Add draw batching and GPU effects according to measured needs.
- [ ] Evaluate 2D lighting, shadows, and post-processing on that renderer.

**Completion criterion:** identify and reproduce bottlenecks, compare improvements
using measurements, and maintain explicit targets for each device.

## Phase 11 — Projects, Distribution, and Extensions

- [ ] Separate the engine package from demonstration games.
- [ ] Create a template for starting independent projects.
- [ ] Validate references and content before export.
- [ ] Export only the runtime and resources required by the selected game.
- [ ] Document web publishing and route and resource configuration.
- [ ] Evaluate PWA installation and offline functionality.
- [ ] Evaluate desktop and mobile packaging for the target platforms.
- [ ] Establish API versioning and an engine migration guide.
- [ ] Define extension points for components, importers, and tools.
- [ ] Add API documentation, an introductory tutorial, and example projects.
- [ ] Automate relevant checks in continuous integration.

**Completion criterion:** create a new project, build a game, and publish it
without manually copying the demonstration catalog or modifying the engine.

## First Integrated Milestone

- [ ] Create a level with a character, enemies, and obstacles defined as data.
- [ ] Configure properties and references through a minimal inspector.
- [ ] Save the level and reopen it without losing its composition.
- [ ] Run and stop it without changing the editing document.
- [ ] Play it with keyboard and complete touch controls.
- [ ] Switch between the menu and level while releasing the corresponding resources.

This milestone combines phases 1–4 with the existing capabilities. It is the first
verifiable goal for moving from writing each level in code to building it with
tools.

## Future Scope

Multiplayer, cloud synchronization, and simultaneous editor collaboration require
their own design. They remain outside the first milestone and must not delay the
scene, component, input, and editing foundations.
