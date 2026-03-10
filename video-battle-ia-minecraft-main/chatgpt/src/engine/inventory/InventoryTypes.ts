import { BlockId } from '../world/BlockTypes';

export const HOTBAR_SIZE = 9;
export const MAIN_INVENTORY_SIZE = 27;
export const INVENTORY_SIZE = HOTBAR_SIZE + MAIN_INVENTORY_SIZE;
export const MAX_STACK_SIZE = 64;

export const ItemId = {
  WoodenPickaxe: 'tool:wooden_pickaxe',
  WoodenAxe: 'tool:wooden_axe',
  Apple: 'food:apple',
  RawPork: 'food:raw_pork',
  Wheat: 'material:wheat',
  Flint: 'material:flint',
  Coin: 'currency:coin',
  ForestBrew: 'food:forest_brew',
} as const;

export type ItemId = (typeof ItemId)[keyof typeof ItemId] | `block:${number}`;
export type ItemKind = 'block' | 'tool' | 'consumable' | 'material' | 'currency';

export type InventoryItemStack = {
  itemId: ItemId;
  count: number;
};

export type InventorySlot = InventoryItemStack | null;

export type PlayerVitals = {
  health: number;
  hunger: number;
};

export type ConsumableEffect = {
  hungerRestore: number;
  healthRestore: number;
  speedBoostSeconds?: number;
};

export type ToolProfile = {
  miningSpeedMultiplier: number;
  preferredBlocks: BlockId[];
};

export type ItemDefinition = {
  id: ItemId;
  label: string;
  kind: ItemKind;
  maxStack: number;
  blockId?: BlockId;
  consumable?: ConsumableEffect;
  tool?: ToolProfile;
};

const TOOL_BLOCKS = [BlockId.Stone, BlockId.Gravel, BlockId.Clay];
const AXE_BLOCKS = [BlockId.Wood, BlockId.Leaves];

const SPECIAL_ITEM_DEFINITIONS: Record<string, ItemDefinition> = {
  [ItemId.WoodenPickaxe]: {
    id: ItemId.WoodenPickaxe,
    label: 'Pioche en bois',
    kind: 'tool',
    maxStack: 1,
    tool: {
      miningSpeedMultiplier: 2.1,
      preferredBlocks: TOOL_BLOCKS,
    },
  },
  [ItemId.WoodenAxe]: {
    id: ItemId.WoodenAxe,
    label: 'Hache en bois',
    kind: 'tool',
    maxStack: 1,
    tool: {
      miningSpeedMultiplier: 2,
      preferredBlocks: AXE_BLOCKS,
    },
  },
  [ItemId.Apple]: {
    id: ItemId.Apple,
    label: 'Pomme',
    kind: 'consumable',
    maxStack: 16,
    consumable: { hungerRestore: 4, healthRestore: 1 },
  },
  [ItemId.RawPork]: {
    id: ItemId.RawPork,
    label: 'Viande crue',
    kind: 'consumable',
    maxStack: 16,
    consumable: { hungerRestore: 6, healthRestore: 0 },
  },
  [ItemId.Wheat]: {
    id: ItemId.Wheat,
    label: 'Ble sauvage',
    kind: 'material',
    maxStack: MAX_STACK_SIZE,
  },
  [ItemId.Flint]: {
    id: ItemId.Flint,
    label: 'Silex',
    kind: 'material',
    maxStack: MAX_STACK_SIZE,
  },
  [ItemId.Coin]: {
    id: ItemId.Coin,
    label: 'Piece',
    kind: 'currency',
    maxStack: MAX_STACK_SIZE,
  },
  [ItemId.ForestBrew]: {
    id: ItemId.ForestBrew,
    label: 'Biere de foret',
    kind: 'consumable',
    maxStack: 8,
    consumable: { hungerRestore: 3, healthRestore: 2, speedBoostSeconds: 12 },
  },
};

export function createBlockItemId(blockId: BlockId): ItemId {
  return `block:${blockId}`;
}

export function tryGetBlockIdFromItem(itemId: ItemId): BlockId | null {
  if (!itemId.startsWith('block:')) {
    return null;
  }
  const value = Number(itemId.slice('block:'.length));
  if (!Number.isInteger(value)) {
    return null;
  }
  return value as BlockId;
}

export function getItemDefinition(itemId: ItemId): ItemDefinition {
  const special = SPECIAL_ITEM_DEFINITIONS[itemId];
  if (special) {
    return special;
  }
  const blockId = tryGetBlockIdFromItem(itemId);
  if (blockId !== null) {
    return {
      id: itemId,
      label: `Bloc #${blockId}`,
      kind: 'block',
      maxStack: MAX_STACK_SIZE,
      blockId,
    };
  }
  return {
    id: itemId,
    label: itemId,
    kind: 'material',
    maxStack: MAX_STACK_SIZE,
  };
}
