/**
 * Defines the platform contract shared by its consumers.
 * @typedef {Platform} Platform
 */
type Platform = {
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
   * Width of the represented area.
   * @property {number} width
   */
  width: number;
  /**
   * Height of the represented area.
   * @property {number} height
   */
  height: number;
  /**
   * Kind configuration or state owned by Platform.
   * @property {"ground" | "brick" | "question"} kind
   */
  kind: 'ground' | 'brick' | 'question';
};


export type { Platform as default };
