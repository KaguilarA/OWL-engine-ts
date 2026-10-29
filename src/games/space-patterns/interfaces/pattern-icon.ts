/**
 * Defines the pattern icon contract shared by its consumers.
 * @interface PatternIcon
 */
export interface PatternIcon {
  /**
   * Image name configuration or state owned by PatternIcon.
   * @property {string} imageName
   */
  imageName: string;
  /**
   * Region name configuration or state owned by PatternIcon.
   * @property {string} regionName
   */
  regionName: string;
}
