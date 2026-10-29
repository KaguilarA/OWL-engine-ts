/**
 * Defines the game choice contract shared by its consumers.
 * @interface GameChoice
 */
export interface GameChoice {
  /**
   * Title configuration or state owned by GameChoice.
   * @property {string} title
   */
  title: string;
  /**
   * Description configuration or state owned by GameChoice.
   * @property {string} description
   */
  description: string;
  /**
   * Start configuration or state owned by GameChoice.
   * @property {(onReturnToMenu: () => void) => void} start
   */
  start: (onReturnToMenu: () => void) => void;
}
