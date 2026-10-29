import type { Tilemap } from '../../engine';
import type { Coin, Platform } from './';

/**
 * Defines the platformer render state contract shared by its consumers.
 * @interface PlatformerRenderState
 */
export interface PlatformerRenderState {
  /**
   * Reactive ground tilemap shared with the terrain collider adapter.
   * @property {Tilemap} terrain
   */
  terrain: Tilemap;
  /**
   * Camera x configuration or state owned by PlatformerRenderState.
   * @property {number} cameraX
   */
  cameraX: number;
  /**
   * Player x configuration or state owned by PlatformerRenderState.
   * @property {number} playerX
   */
  playerX: number;
  /**
   * Player y configuration or state owned by PlatformerRenderState.
   * @property {number} playerY
   */
  playerY: number;
  /**
   * Facing configuration or state owned by PlatformerRenderState.
   * @property {number} facing
   */
  facing: number;
  /**
   * Score configuration or state owned by PlatformerRenderState.
   * @property {number} score
   */
  score: number;
  /**
   * Lives configuration or state owned by PlatformerRenderState.
   * @property {number} lives
   */
  lives: number;
  /**
   * Won configuration or state owned by PlatformerRenderState.
   * @property {boolean} won
   */
  won: boolean;
  /**
   * Enemy x configuration or state owned by PlatformerRenderState.
   * @property {number} enemyX
   */
  enemyX: number;
  /**
   * Moving configuration or state owned by PlatformerRenderState.
   * @property {boolean} moving
   */
  moving: boolean;
  /**
   * Platforms configuration or state owned by PlatformerRenderState.
   * @property {Platform[]} platforms
   */
  platforms: readonly Platform[];
  /**
   * Coins configuration or state owned by PlatformerRenderState.
   * @property {Coin[]} coins
   */
  coins: readonly Coin[];
}

