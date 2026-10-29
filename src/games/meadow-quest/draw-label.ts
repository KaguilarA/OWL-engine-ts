/**
 * Defines the draw label contract shared by its consumers.
 * @typedef {DrawLabel} DrawLabel
 */
type DrawLabel = (text: string, x: number, y: number, size: number, color: string, align: CanvasTextAlign) => void;


export type { DrawLabel as default };
