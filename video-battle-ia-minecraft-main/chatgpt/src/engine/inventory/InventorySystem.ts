import { BlockId } from '../world/BlockTypes';
import {
  HOTBAR_SIZE,
  INVENTORY_SIZE,
  MAIN_INVENTORY_SIZE,
  ItemId,
  createBlockItemId,
  getItemDefinition,
  tryGetBlockIdFromItem,
  type InventoryItemStack,
  type InventorySlot,
  type PlayerVitals,
} from './InventoryTypes';

type InventoryListener = () => void;

function cloneStack(stack: InventoryItemStack): InventoryItemStack {
  return { itemId: stack.itemId, count: stack.count };
}

export class InventorySystem {
  private readonly slots: InventorySlot[] = new Array(INVENTORY_SIZE).fill(null);
  private readonly listeners = new Set<InventoryListener>();
  private cursorStack: InventoryItemStack | null = null;
  private selectedHotbarIndex = 0;
  private readonly vitals: PlayerVitals = { health: 20, hunger: 20 };

  constructor() {
    this.validateInventoryConfig();
  }

  subscribe(listener: InventoryListener): () => void {
    this.listeners.add(listener);
    listener();
    return () => this.listeners.delete(listener);
  }

  getVitals(): PlayerVitals {
    return { ...this.vitals };
  }

  applyDamage(amount: number): void {
    const damage = Math.max(0, Math.floor(amount));
    if (damage <= 0) {
      return;
    }
    const next = Math.max(0, this.vitals.health - damage);
    if (next === this.vitals.health) {
      return;
    }
    this.vitals.health = next;
    this.notify();
  }

  heal(amount: number): void {
    const healing = Math.max(0, Math.floor(amount));
    if (healing <= 0) {
      return;
    }
    const next = Math.min(20, this.vitals.health + healing);
    if (next === this.vitals.health) {
      return;
    }
    this.vitals.health = next;
    this.notify();
  }

  getSlotsSnapshot(): InventorySlot[] {
    return this.slots.map((slot) => (slot ? cloneStack(slot) : null));
  }

  getCursorStack(): InventoryItemStack | null {
    return this.cursorStack ? cloneStack(this.cursorStack) : null;
  }

  getSelectedHotbarIndex(): number {
    return this.selectedHotbarIndex;
  }

  setSelectedHotbarIndex(index: number): void {
    const next = Math.max(0, Math.min(HOTBAR_SIZE - 1, index));
    if (next !== this.selectedHotbarIndex) {
      this.selectedHotbarIndex = next;
      this.notify();
    }
  }

  cycleSelectedHotbar(delta: number): void {
    const next = (this.selectedHotbarIndex + delta + HOTBAR_SIZE) % HOTBAR_SIZE;
    this.setSelectedHotbarIndex(next);
  }

  getSelectedBlockId(): BlockId | null {
    const slot = this.slots[this.selectedHotbarIndex];
    if (!slot) {
      return null;
    }
    return tryGetBlockIdFromItem(slot.itemId);
  }

  getSelectedItemStack(): InventoryItemStack | null {
    const slot = this.slots[this.selectedHotbarIndex];
    return slot ? cloneStack(slot) : null;
  }

  getSelectedMiningSpeedMultiplier(blockId: BlockId): number {
    const slot = this.slots[this.selectedHotbarIndex];
    if (!slot) {
      return 1;
    }
    const def = getItemDefinition(slot.itemId);
    if (!def.tool) {
      return 1;
    }
    if (!def.tool.preferredBlocks.includes(blockId)) {
      return Math.max(1.1, def.tool.miningSpeedMultiplier * 0.55);
    }
    return def.tool.miningSpeedMultiplier;
  }

  useSelectedConsumable(): { consumed: boolean; label: string; speedBoostSeconds: number } {
    const slot = this.slots[this.selectedHotbarIndex];
    if (!slot) {
      return { consumed: false, label: '', speedBoostSeconds: 0 };
    }
    const def = getItemDefinition(slot.itemId);
    if (!def.consumable) {
      return { consumed: false, label: '', speedBoostSeconds: 0 };
    }
    this.vitals.hunger = Math.min(20, this.vitals.hunger + def.consumable.hungerRestore);
    this.vitals.health = Math.min(20, this.vitals.health + def.consumable.healthRestore);
    slot.count -= 1;
    if (slot.count <= 0) {
      this.slots[this.selectedHotbarIndex] = null;
    }
    this.notify();
    return {
      consumed: true,
      label: def.label,
      speedBoostSeconds: def.consumable.speedBoostSeconds ?? 0,
    };
  }

  tickVitals(dt: number): { died: boolean } {
    if (dt <= 0) {
      return { died: false };
    }
    const hungerDecay = 0.22 * dt;
    this.vitals.hunger = Math.max(0, this.vitals.hunger - hungerDecay);
    if (this.vitals.hunger > 18) {
      this.vitals.health = Math.min(20, this.vitals.health + 0.42 * dt);
    } else if (this.vitals.hunger <= 0.01) {
      this.vitals.health = Math.max(0, this.vitals.health - 0.85 * dt);
    }
    this.notify();
    return { died: this.vitals.health <= 0 };
  }

  consumeSelectedBlock(count = 1): boolean {
    if (count <= 0) {
      return true;
    }
    const slot = this.slots[this.selectedHotbarIndex];
    if (!slot || slot.count < count) {
      return false;
    }
    slot.count -= count;
    if (slot.count <= 0) {
      this.slots[this.selectedHotbarIndex] = null;
    }
    this.notify();
    return true;
  }

  addItem(blockId: BlockId, count = 1): boolean {
    return this.addItemById(createBlockItemId(blockId), count);
  }

  addItemById(itemId: ItemId, count = 1): boolean {
    const def = getItemDefinition(itemId);
    if (count <= 0) {
      return true;
    }
    let remaining = count;

    for (let i = 0; i < INVENTORY_SIZE; i += 1) {
      const slot = this.slots[i];
      if (!slot || slot.itemId !== itemId || slot.count >= def.maxStack) {
        continue;
      }
      const canAdd = Math.min(def.maxStack - slot.count, remaining);
      slot.count += canAdd;
      remaining -= canAdd;
      if (remaining <= 0) {
        this.notify();
        return true;
      }
    }

    for (let i = 0; i < INVENTORY_SIZE; i += 1) {
      if (this.slots[i] !== null) {
        continue;
      }
      const canAdd = Math.min(def.maxStack, remaining);
      this.slots[i] = { itemId, count: canAdd };
      remaining -= canAdd;
      if (remaining <= 0) {
        this.notify();
        return true;
      }
    }

    this.notify();
    return false;
  }

  handleLeftClickOnSlot(index: number): void {
    if (!this.isValidIndex(index)) {
      return;
    }
    const slot = this.slots[index];

    if (!this.cursorStack) {
      if (!slot) {
        return;
      }
      this.cursorStack = cloneStack(slot);
      this.slots[index] = null;
      this.notify();
      return;
    }

    if (!slot) {
      this.slots[index] = cloneStack(this.cursorStack);
      this.cursorStack = null;
      this.notify();
      return;
    }

    const slotDef = getItemDefinition(slot.itemId);
    if (slot.itemId === this.cursorStack.itemId && slot.count < slotDef.maxStack) {
      const transfer = Math.min(slotDef.maxStack - slot.count, this.cursorStack.count);
      slot.count += transfer;
      this.cursorStack.count -= transfer;
      if (this.cursorStack.count <= 0) {
        this.cursorStack = null;
      }
      this.notify();
      return;
    }

    const temp = cloneStack(slot);
    this.slots[index] = cloneStack(this.cursorStack);
    this.cursorStack = temp;
    this.notify();
  }

  handleRightClickOnSlot(index: number): void {
    if (!this.isValidIndex(index)) {
      return;
    }
    const slot = this.slots[index];

    if (!this.cursorStack) {
      if (!slot) {
        return;
      }
      const picked = Math.ceil(slot.count / 2);
      this.cursorStack = { itemId: slot.itemId, count: picked };
      slot.count -= picked;
      if (slot.count <= 0) {
        this.slots[index] = null;
      }
      this.notify();
      return;
    }

    if (!slot) {
      this.slots[index] = { itemId: this.cursorStack.itemId, count: 1 };
      this.cursorStack.count -= 1;
      if (this.cursorStack.count <= 0) {
        this.cursorStack = null;
      }
      this.notify();
      return;
    }

    const slotDef = getItemDefinition(slot.itemId);
    if (slot.itemId === this.cursorStack.itemId && slot.count < slotDef.maxStack) {
      slot.count += 1;
      this.cursorStack.count -= 1;
      if (this.cursorStack.count <= 0) {
        this.cursorStack = null;
      }
      this.notify();
    }
  }

  dropCursorOne(): InventoryItemStack | null {
    if (!this.cursorStack) {
      return null;
    }
    const dropped: InventoryItemStack = { itemId: this.cursorStack.itemId, count: 1 };
    this.cursorStack.count -= 1;
    if (this.cursorStack.count <= 0) {
      this.cursorStack = null;
    }
    this.notify();
    return dropped;
  }

  dropCursorAll(): InventoryItemStack | null {
    if (!this.cursorStack) {
      return null;
    }
    const dropped = cloneStack(this.cursorStack);
    this.cursorStack = null;
    this.notify();
    return dropped;
  }

  private isValidIndex(index: number): boolean {
    return index >= 0 && index < INVENTORY_SIZE;
  }

  private notify(): void {
    for (const listener of this.listeners) {
      listener();
    }
  }

  private validateInventoryConfig(): void {
    if (this.slots.length !== HOTBAR_SIZE + MAIN_INVENTORY_SIZE) {
      throw new Error('Configuration inventaire invalide');
    }
  }

  hasItems(itemId: ItemId, count: number): boolean {
    if (count <= 0) {
      return true;
    }
    let total = 0;
    for (const slot of this.slots) {
      if (!slot || slot.itemId !== itemId) {
        continue;
      }
      total += slot.count;
      if (total >= count) {
        return true;
      }
    }
    return false;
  }

  removeItems(itemId: ItemId, count: number): boolean {
    if (!this.hasItems(itemId, count)) {
      return false;
    }
    let remaining = count;
    for (let i = 0; i < this.slots.length && remaining > 0; i += 1) {
      const slot = this.slots[i];
      if (!slot || slot.itemId !== itemId) {
        continue;
      }
      const take = Math.min(slot.count, remaining);
      slot.count -= take;
      remaining -= take;
      if (slot.count <= 0) {
        this.slots[i] = null;
      }
    }
    this.notify();
    return true;
  }
}
