/**
 * Insets in logical canvas coordinates, recalculated after device rotation.
 * @interface SafeAreaInsets
 */
export interface SafeAreaInsets {
  /**
   * Top configuration or state owned by SafeAreaInsets.
   * @property {number} top
   */
  top: number;
  /**
   * Right configuration or state owned by SafeAreaInsets.
   * @property {number} right
   */
  right: number;
  /**
   * Bottom configuration or state owned by SafeAreaInsets.
   * @property {number} bottom
   */
  bottom: number;
  /**
   * Left configuration or state owned by SafeAreaInsets.
   * @property {number} left
   */
  left: number;
}
