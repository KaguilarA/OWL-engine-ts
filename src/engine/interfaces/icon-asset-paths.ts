/**
 * Defines the icon asset paths contract shared by its consumers.
 * @interface IconAssetPaths
 */
export interface IconAssetPaths {
  /**
   * Normal configuration or state owned by IconAssetPaths.
   * @property {string} normal
   */
  normal: string;
  /**
   * Blurred configuration or state owned by IconAssetPaths.
   * @property {string} blurred
   */
  blurred: string;
  /**
   * Spine configuration or state owned by IconAssetPaths.
   * @property {{ json: string; atlas: string; } | undefined} spine
   */
  spine?: {
    /**
     * Json configuration or state owned by IconAssetPaths.
     * @property {string} json
     */
    json: string;
    /**
     * Atlas configuration or state owned by IconAssetPaths.
     * @property {string} atlas
     */
    atlas: string;
  };
}
