import { create } from 'zustand';
import { BLOCK_TYPES } from '../game/constants';

export interface ItemStack {
  id: string; // Unique ID for drag and drop
  type: number;
  count: number;
}

interface InventoryState {
  items: (ItemStack | null)[]; // 36 slots (9 hotbar + 27 main)
  armor: (ItemStack | null)[]; // 4 slots
  crafting: (ItemStack | null)[]; // 4 slots (2x2)
  craftingResult: ItemStack | null;
  
  selectedSlot: number; // 0-8 (hotbar)
  
  isOpen: boolean;
  isMenuOpen: boolean; // Pause menu
  
  health: number; // 0-20
  food: number; // 0-20
  saturation: number;

  // Stats
  stats: {
    blocksMined: Record<number, number>;
    blocksPlaced: Record<number, number>;
    distanceWalked: number;
    jumps: number;
    timePlayed: number;
  };

  addItem: (type: number, count?: number) => boolean;
  removeItem: (index: number, count?: number) => void;
  moveItem: (fromIndex: number, toIndex: number) => void;
  setSlot: (index: number, item: ItemStack | null) => void;
  selectSlot: (index: number) => void;
  
  toggleInventory: () => void;
  toggleMenu: () => void;
  setMenuOpen: (isOpen: boolean) => void;
  
  setHealth: (val: number) => void;
  setFood: (val: number) => void;

  // Stats Actions
  incrementBlockStat: (category: 'mined' | 'placed', blockType: number, amount?: number) => void;
  incrementGeneralStat: (stat: 'distance' | 'jumps' | 'time', amount?: number) => void;
}

const INVENTORY_SIZE = 36;
const HOTBAR_SIZE = 9;

export const useInventoryStore = create<InventoryState>((set, get) => ({
  items: Array(INVENTORY_SIZE).fill(null).map((_, i) => {
    // Fill hotbar with some starter items
    if (i === 0) return { id: 'start-1', type: BLOCK_TYPES.DIRT, count: 64 };
    if (i === 1) return { id: 'start-2', type: BLOCK_TYPES.STONE, count: 64 };
    if (i === 2) return { id: 'start-3', type: BLOCK_TYPES.WOOD, count: 64 };
    if (i === 3) return { id: 'start-4', type: BLOCK_TYPES.LEAVES, count: 64 };
    if (i === 4) return { id: 'start-5', type: BLOCK_TYPES.GRASS, count: 64 };
    if (i === 5) return { id: 'start-6', type: BLOCK_TYPES.FLOWER_RED, count: 64 };
    if (i === 6) return { id: 'start-7', type: BLOCK_TYPES.FLOWER_YELLOW, count: 64 };
    if (i === 7) return { id: 'start-8', type: BLOCK_TYPES.SAND, count: 64 };
    if (i === 8) return { id: 'start-9', type: BLOCK_TYPES.WATER, count: 64 };
    return null;
  }),
  armor: Array(4).fill(null),
  crafting: Array(4).fill(null),
  craftingResult: null,
  
  selectedSlot: 0,
  isOpen: false,
  isMenuOpen: false,
  
  health: 20,
  food: 20,
  saturation: 5,

  stats: {
    blocksMined: {},
    blocksPlaced: {},
    distanceWalked: 0,
    jumps: 0,
    timePlayed: 0,
  },

  addItem: (type, count = 1) => {
    const { items } = get();
    // Try to stack first
    const stackableIndex = items.findIndex(item => item && item.type === type && item.count < 64);
    
    if (stackableIndex !== -1) {
      const newItems = [...items];
      const item = newItems[stackableIndex]!;
      const space = 64 - item.count;
      const toAdd = Math.min(space, count);
      
      newItems[stackableIndex] = { ...item, count: item.count + toAdd };
      set({ items: newItems });
      
      if (count > space) {
        return get().addItem(type, count - space);
      }
      return true;
    }
    
    // Empty slot
    const emptyIndex = items.findIndex(item => item === null);
    if (emptyIndex !== -1) {
      const newItems = [...items];
      newItems[emptyIndex] = { id: Math.random().toString(36).substr(2, 9), type, count };
      set({ items: newItems });
      return true;
    }
    
    return false;
  },

  removeItem: (index, count = 1) => {
    const { items } = get();
    if (!items[index]) return;
    
    const newItems = [...items];
    const item = newItems[index]!;
    
    if (item.count <= count) {
      newItems[index] = null;
    } else {
      newItems[index] = { ...item, count: item.count - count };
    }
    set({ items: newItems });
  },

  moveItem: (fromIndex, toIndex) => {
    const { items } = get();
    const newItems = [...items];
    const temp = newItems[fromIndex];
    newItems[fromIndex] = newItems[toIndex];
    newItems[toIndex] = temp;
    set({ items: newItems });
  },

  setSlot: (index, item) => {
    const { items } = get();
    const newItems = [...items];
    newItems[index] = item;
    set({ items: newItems });
  },

  selectSlot: (index) => set({ selectedSlot: index }),
  
  toggleInventory: () => set(state => ({ isOpen: !state.isOpen, isMenuOpen: false })),
  toggleMenu: () => set(state => ({ isMenuOpen: !state.isMenuOpen, isOpen: false })),
  setMenuOpen: (isOpen: boolean) => set({ isMenuOpen: isOpen, isOpen: false }),
  
  setHealth: (val) => set({ health: Math.max(0, Math.min(20, val)) }),
  setFood: (val) => set({ food: Math.max(0, Math.min(20, val)) }),

  incrementBlockStat: (category, blockType, amount = 1) => set(state => {
    console.log(`Incrementing ${category} stat for block ${blockType}`);
    const targetMap = category === 'mined' ? 'blocksMined' : 'blocksPlaced';
    const currentVal = state.stats[targetMap][blockType] || 0;
    
    return {
      stats: {
        ...state.stats,
        [targetMap]: {
          ...state.stats[targetMap],
          [blockType]: currentVal + amount
        }
      }
    };
  }),

  incrementGeneralStat: (stat, amount = 1) => set(state => {
    let key: 'distanceWalked' | 'jumps' | 'timePlayed';
    if (stat === 'distance') key = 'distanceWalked';
    else if (stat === 'time') key = 'timePlayed';
    else key = 'jumps';

    return {
      stats: {
        ...state.stats,
        [key]: state.stats[key] + amount
      }
    };
  }),
}));
