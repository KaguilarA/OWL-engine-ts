# Project Laws

These five laws apply to every change in this repository. Review them before
implementation and before declaring any work complete.

1. **Singleton and SOLID always.** Each unit has a single responsibility.
   Whenever a single instance is possible, use a singleton. Do not make state
   global when it necessarily belongs to distinct entities or scenes.
2. **One definition per file.** Each independent class, interface, function, or
   constant has its own file. Definitions use `export default`; interfaces are
   the exception and use named exports. Methods and properties belong to their
   class. Barrel files only re-export definitions.
   Exported classes and functions must be anonymous default declarations. Assign
   their public names only in barrels, for example:
   `export { default as GameEngine } from './game-engine';`.
   Self references use the barrel alias; do not restore a local declaration name.
   Keep each singleton in its existing implementation file and export the
   anonymous class's `.instance` directly:
   `export default (class { static readonly instance = new this(); }).instance;`.
   Do not introduce separate service-class or instance-facade files for this pattern.
   Every interface used by the engine belongs directly in `src/engine/interfaces`,
   one per file, and must be exported by `src/engine/interfaces/index.ts`.
   Do not declare engine interfaces in implementation files or create additional
   interface directories inside engine modules.
3. **Reactive values always.** Every value that needs to be reactive uses
   `reactive-values`, through signals and derived values. Do not duplicate that
   state in ordinary fields or introduce another reactivity mechanism.
4. **Clear, multiline JSDoc always.** Never write single-line JSDoc documentation.
   Explain responsibility and behavior using the applicable tags: `@class`,
   `@interface`, `@typedef`, `@property`, `@param`, `@returns`, visibility, and
   any other relevant tags. Document parameters and return values, including
   `void`, for documented functions and methods. Expanding a comment is not
   enough: its content must explain what the unit does.
5. **Barrel files always.** Every local TypeScript import, including types,
   tests, and dynamic imports, goes through an `index.ts` barrel. Never import
   directly from an implementation file. Group imports from the same source.

## Game Requirements

- Every game must be fully playable using touch controls on phones and tablets,
  in both portrait and landscape orientations.
- Preserve keyboard support and simultaneous input whenever gameplay requires it.
- Release controls, listeners, and resources when closing a scene or game.

## Verification

- Run the import and documentation checks.
- Run TypeScript checks, relevant tests, and the build when the change requires them.
- Do not declare a law satisfied or a phase complete while violations remain.
