/**
 * JSON snapshot data, independent of live entities and signals.
 * @typedef {SaveData} SaveData
 */
type SaveData = null | boolean | number | string | SaveData[] | { [key: string]: SaveData };

export type { SaveData as default };
