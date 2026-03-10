import { create } from 'zustand';
import { BLOCK_TYPES } from './game/constants';
import { generateChunk } from './game/world';

interface WorldState {
  chunks: Map<string, { x: number, y: number, z: number, type: number }[]>;
  addBlock: (x: number, y: number, z: number, type: number) => void;
  removeBlock: (x: number, y: number, z: number) => void;
  loadChunk: (x: number, z: number) => void;
  unloadChunk: (x: number, z: number) => void;
  setChunks: (chunksToLoad: {x: number, z: number}[], chunksToUnload: {x: number, z: number}[]) => void;
  getBlock: (x: number, y: number, z: number) => number;
}

export const useWorldStore = create<WorldState>((set, get) => ({
  chunks: new Map(),
  
  getBlock: (x, y, z) => {
    const chunkX = Math.floor(x / 16);
    const chunkZ = Math.floor(z / 16);
    const key = `${chunkX},${chunkZ}`;
    const chunk = get().chunks.get(key);
    
    if (!chunk) return 0; // Air if not loaded
    
    const block = chunk.find(b => b.x === (x % 16 + 16) % 16 && b.y === y && b.z === (z % 16 + 16) % 16);
    return block ? block.type : 0;
  },
  
  addBlock: (x, y, z, type) => {
    // Determine chunk
    const chunkX = Math.floor(x / 16);
    const chunkZ = Math.floor(z / 16);
    const key = `${chunkX},${chunkZ}`;
    
    // Update chunk data
    set((state) => {
      const newChunks = new Map(state.chunks);
      const oldChunk = newChunks.get(key) || [];
      
      // Create a NEW array reference to ensure React detects the change
      const chunk = [...oldChunk];
      
      // Remove existing block at same position if any
      const localX = (x % 16 + 16) % 16;
      const localZ = (z % 16 + 16) % 16;
      
      const existingIndex = chunk.findIndex(b => b.x === localX && b.y === y && b.z === localZ);
      if (existingIndex !== -1) chunk.splice(existingIndex, 1);
      
      chunk.push({ x: localX, y, z: localZ, type });
      newChunks.set(key, chunk);
      return { chunks: newChunks };
    });
  },
  
  removeBlock: (x, y, z) => {
    const chunkX = Math.floor(x / 16);
    const chunkZ = Math.floor(z / 16);
    const key = `${chunkX},${chunkZ}`;
    
    set((state) => {
      const newChunks = new Map(state.chunks);
      const chunk = newChunks.get(key);
      if (!chunk) return state;
      
      const localX = (x % 16 + 16) % 16;
      const localZ = (z % 16 + 16) % 16;
      
      const newChunk = chunk.filter(b => !(b.x === localX && b.y === y && b.z === localZ));
      newChunks.set(key, newChunk);
      return { chunks: newChunks };
    });
  },
  
  loadChunk: (x, z) => {
    const key = `${x},${z}`;
    if (get().chunks.has(key)) return;
    
    const chunkData = generateChunk(x, z);
    set((state) => {
      const newChunks = new Map(state.chunks);
      newChunks.set(key, chunkData);
      return { chunks: newChunks };
    });
  },

  unloadChunk: (x, z) => {
      const key = `${x},${z}`;
      set((state) => {
          if (!state.chunks.has(key)) return state;
          const newChunks = new Map(state.chunks);
          newChunks.delete(key);
          return { chunks: newChunks };
      });
  },

  setChunks: (chunksToLoad, chunksToUnload) => {
      set((state) => {
          const newChunks = new Map(state.chunks);
          let changed = false;

          chunksToUnload.forEach(({x, z}) => {
              const key = `${x},${z}`;
              if (newChunks.has(key)) {
                  newChunks.delete(key);
                  changed = true;
              }
          });

          chunksToLoad.forEach(({x, z}) => {
              const key = `${x},${z}`;
              if (!newChunks.has(key)) {
                  const chunkData = generateChunk(x, z);
                  newChunks.set(key, chunkData);
                  changed = true;
              }
          });
          
          if (!changed) return state;
          return { chunks: newChunks };
      });
  }
}));
