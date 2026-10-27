import { computedValue, signalValue, type ComputedValue, type SignalValue } from 'reactive-values';
import type { InventoryStack } from '../../interfaces/inventory-stack';

/**
 * Slot-limited, stack-based inventory for role-playing and survival games.
 * @class Inventory
 */
export default class Inventory {
  /**
   * Maximum number of item stacks.
   * @property {number} capacity
   * @public
   * @readonly
   */
  public readonly capacity: number;

  /**
   * Reactive item stacks in insertion order.
   * @property {SignalValue<readonly InventoryStack[]>} stacks
   * @public
   * @readonly
   */
  public readonly stacks: SignalValue<readonly InventoryStack[]> = signalValue<readonly InventoryStack[]>([]);

  /**
   * Whether the inventory has used every slot.
   * @property {ComputedValue<boolean>} isFull
   * @public
   * @readonly
   */
  public readonly isFull: ComputedValue<boolean>;

  /**
   * Creates an inventory with a fixed number of stack slots.
   * @param capacity Maximum stack count.
   * @public
   * @return {void}
   */
  public constructor(capacity: number) {
    if (!Number.isInteger(capacity) || capacity <= 0) throw new RangeError('Inventory capacity must be a positive integer.');
    this.capacity = capacity;
    this.isFull = computedValue(() => this.stacks().length >= this.capacity, [this.stacks]);
  }

  /**
   * Adds items to an existing stack or opens a new stack when capacity allows.
   * @param itemId Item identifier.
   * @param quantity Positive item count.
   * @param maxStackSize Maximum count allowed in one stack.
   * @public
   * @return {boolean} Whether the entire quantity was stored.
   */
  public add(itemId: string, quantity = 1, maxStackSize = 99): boolean {
    this.validateItem(itemId, quantity, maxStackSize);
    const current = this.stacks();
    const existing = current.find((stack) => stack.itemId === itemId);
    const existingSpace = existing ? maxStackSize - existing.quantity : 0;
    const remaining = Math.max(0, quantity - existingSpace);
    const newStackCount = Math.ceil(remaining / maxStackSize);
    if (current.length + newStackCount > this.capacity) return false;
    let quantityToAllocate = remaining;
    const next = existing
      ? current.map((stack) => stack === existing
        ? { ...stack, quantity: stack.quantity + Math.min(existingSpace, quantity) }
        : stack)
      : [...current];
    for (let index = 0; index < newStackCount; index++) {
      const stackQuantity = Math.min(maxStackSize, quantityToAllocate);
      next.push({ itemId, quantity: stackQuantity });
      quantityToAllocate -= stackQuantity;
    }
    this.stacks.set(next);
    return true;
  }

  /**
   * Removes a quantity from an item stack and deletes empty stacks.
   * @param itemId Item identifier.
   * @param quantity Positive item count to remove.
   * @public
   * @return {boolean} Whether the requested quantity was available.
   */
  public remove(itemId: string, quantity = 1): boolean {
    if (!Number.isInteger(quantity) || quantity <= 0) throw new RangeError('Removal quantity must be a positive integer.');
    const available = this.count(itemId);
    if (available < quantity) return false;
    let remaining = quantity;
    const next = this.stacks().flatMap((stack) => {
      if (stack.itemId !== itemId || remaining === 0) return [stack];
      const removed = Math.min(stack.quantity, remaining);
      remaining -= removed;
      const left = stack.quantity - removed;
      return left > 0 ? [{ ...stack, quantity: left }] : [];
    });
    this.stacks.set(next);
    return true;
  }

  /**
   * Returns the quantity held for an item identifier.
   * @param itemId Item identifier.
   * @public
   * @return {number}
   */
  public count(itemId: string): number {
    return this.stacks().filter((stack) => stack.itemId === itemId)
      .reduce((total, stack) => total + stack.quantity, 0);
  }

  /**
   * Removes every item stack.
   * @public
   * @return {void}
   */
  public clear(): void {
    this.stacks.set([]);
  }

  /**
   * Validates item identifiers and stack limits.
   * @param itemId Item identifier.
   * @param quantity Item count.
   * @param maxStackSize Maximum stack size.
   * @private
   * @return {void}
   */
  private validateItem(itemId: string, quantity: number, maxStackSize: number): void {
    if (!itemId.trim()) throw new RangeError('Inventory item identifier cannot be empty.');
    if (!Number.isInteger(quantity) || quantity <= 0) throw new RangeError('Item quantity must be a positive integer.');
    if (!Number.isInteger(maxStackSize) || maxStackSize <= 0) throw new RangeError('Maximum stack size must be a positive integer.');
  }
}
