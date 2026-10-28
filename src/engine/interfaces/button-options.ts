/**
 * Defines the button options contract shared by its consumers.
 * @interface ButtonOptions
 */
export interface ButtonOptions {
  /**
   * Callback handling click for ButtonOptions.
   * @property {() => void} onClick
   */
  onClick: () => void;
  /**
   * Callback handling press for ButtonOptions.
   * @property {((pointerId: number) => void) | undefined} onPress
   */
  onPress?: (pointerId: number) => void;
  /**
   * Callback handling release for ButtonOptions.
   * @property {((pointerId: number, cancelled?: boolean | undefined) => void) | undefined} onRelease
   */
  onRelease?: (pointerId: number, cancelled?: boolean) => void;
  /**
   * Shape configuration or state owned by ButtonOptions.
   * @property {"rectangle" | "circle" | undefined} shape
   */
  shape?: 'rectangle' | 'circle';
  /**
   * Dimensions configuration or state owned by ButtonOptions.
   * @property {{ x: number; y: number; width: number; height: number; pivotX?: number | undefined; pivotY?: number | undefined; } | undefined} dimensions
   */
  dimensions?: {
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
     * Pivot x configuration or state owned by ButtonOptions.
     * @property {number | undefined} pivotX
     */
    pivotX?: number;
    /**
     * Pivot y configuration or state owned by ButtonOptions.
     * @property {number | undefined} pivotY
     */
    pivotY?: number;
  };
}
