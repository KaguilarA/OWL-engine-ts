/**
 * Defines the spine slot pose contract shared by its consumers.
 * @interface SpineSlotPose
 */
export interface SpineSlotPose {
  /**
   * Name used to identify or look up this resource.
   * @property {string} name
   */
  name: string;
  /**
   * Bone index configuration or state owned by SpineSlotPose.
   * @property {number} boneIndex
   */
  boneIndex: number;
  /**
   * Attachment name configuration or state owned by SpineSlotPose.
   * @property {string | null} attachmentName
   */
  attachmentName: string | null;
  /**
   * Color applied when rendering this content.
   * @property {string} color
   */
  color: string;
  /**
   * Dark color configuration or state owned by SpineSlotPose.
   * @property {string | undefined} darkColor
   */
  darkColor?: string;
  /**
   * Blend mode configuration or state owned by SpineSlotPose.
   * @property {"normal" | "additive" | "multiply" | "screen"} blendMode
   */
  blendMode: 'normal' | 'additive' | 'multiply' | 'screen';
}
