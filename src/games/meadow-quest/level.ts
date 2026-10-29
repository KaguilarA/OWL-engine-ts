/**
 * Defines the platform contract shared by its consumers.
 * @typedef {Platform} Platform
 */
export type Platform = {
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

/**
 * Defines the coin contract shared by its consumers.
 * @typedef {Coin} Coin
 */
export type Coin = {
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
 * Collected configuration or state owned by Coin.
 * @property {boolean} collected
 */
collected: boolean };

/**
 * Builds the original level layout in logical canvas coordinates.
 * @param {number} height Available height in logical canvas coordinates.
 * @param {number} worldWidth
 * @returns {{ platforms: Platform[]; coins: Coin[]; }}
 */
export default function(height: number, worldWidth: number): {
/**
 * Platforms configuration or state owned by level.
 * @property {Platform[]} platforms
 */
platforms: Platform[];
/**
 * Coins configuration or state owned by level.
 * @property {Coin[]} coins
 */
coins: Coin[] } {
  const floor = height * 0.79;
  const block = Math.max(28, Math.min(46, height * 0.06));
  const platforms: Platform[] = [
    { x: 0, y: floor, width: worldWidth, height: 100, kind: 'ground' },
    { x: 340, y: floor - block * 2, width: block, height: block, kind: 'question' },
    { x: 382, y: floor - block * 2, width: block, height: block, kind: 'brick' },
    { x: 424, y: floor - block * 2, width: block, height: block, kind: 'brick' },
    { x: 760, y: floor - block * 2.2, width: block * 2.2, height: block * 0.55, kind: 'brick' },
    { x: 1210, y: floor - block * 3.1, width: block, height: block, kind: 'question' },
    { x: 1252, y: floor - block * 3.1, width: block, height: block, kind: 'brick' },
    { x: 1650, y: floor - block * 1.8, width: block * 3, height: block * 0.55, kind: 'brick' },
    { x: 2130, y: floor - block * 2.8, width: block, height: block, kind: 'question' },
    { x: 2172, y: floor - block * 2.8, width: block, height: block, kind: 'brick' },
    { x: 2690, y: floor - block * 2.1, width: block * 2, height: block * 0.55, kind: 'brick' }
  ];
  const coins: Coin[] = [
    { x: 235, y: floor - block * 1.1, collected: false }, { x: 356, y: floor - block * 3, collected: false },
    { x: 550, y: floor - block * 1.2, collected: false }, { x: 810, y: floor - block * 3.1, collected: false },
    { x: 1030, y: floor - block * 1.2, collected: false }, { x: 1226, y: floor - block * 4.1, collected: false },
    { x: 1710, y: floor - block * 2.7, collected: false }, { x: 2188, y: floor - block * 3.8, collected: false },
    { x: 2550, y: floor - block * 1.2, collected: false }, { x: 2880, y: floor - block * 1.2, collected: false }
  ];
  return { platforms, coins };
}
