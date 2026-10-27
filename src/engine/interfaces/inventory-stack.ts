/**
 * A stack of matching items held by an inventory.
 * @interface InventoryStack
 */
export interface InventoryStack {
  /**
   * Stable identifier for the item type.
   * @property {string} itemId
   */
  readonly itemId: string;

  /**
   * Number of items held in this stack.
   * @property {number} quantity
   */
  readonly quantity: number;
}
