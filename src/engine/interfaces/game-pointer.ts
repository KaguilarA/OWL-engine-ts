/**
 * Defines the game pointer contract shared by its consumers.
 * @interface GamePointer
 */
export interface GamePointer {
  /**
   * Id configuration or state owned by GamePointer.
   * @property {number} id
   */
  id: number;
  /**
   * Horizontal coordinate in the owning coordinate space.
   * @property {number} x
   */
  x: number;
  /**
   * Vertical coordinate in the owning coordinate space.
   * @property {number} y
   */
  y: number;
  /**
   * Cancellation or lost capture must release input without activating a click.
   * @property {boolean | undefined} cancelled
   */
  cancelled?: boolean;
}
