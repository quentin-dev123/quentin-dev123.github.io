import { create } from 'zustand';

export type MobType = 'zombie' | 'skeleton' | 'spider';
export type MobState = 'idle' | 'chase' | 'attack' | 'hit' | 'dead';

export interface MobEntity {
  id: string;
  type: MobType;
  position: [number, number, number];
  rotation: [number, number, number];
  health: number;
  maxHealth: number;
  state: MobState;
  target?: [number, number, number]; // Position to move towards
}

interface MobStore {
  mobs: MobEntity[];
  spawnMob: (type: MobType, position: [number, number, number]) => void;
  removeMob: (id: string) => void;
  updateMob: (id: string, updates: Partial<MobEntity>) => void;
  damageMob: (id: string, amount: number) => void;
}

export const useMobStore = create<MobStore>((set) => ({
  mobs: [],
  
  spawnMob: (type, position) => {
    const id = Math.random().toString(36).substr(2, 9);
    const maxHealth = type === 'spider' ? 16 : 20; // Spider has less health
    
    set((state) => ({
      mobs: [
        ...state.mobs,
        {
          id,
          type,
          position,
          rotation: [0, 0, 0],
          health: maxHealth,
          maxHealth,
          state: 'idle'
        }
      ]
    }));
  },
  
  removeMob: (id) => {
    set((state) => ({
      mobs: state.mobs.filter((mob) => mob.id !== id)
    }));
  },
  
  updateMob: (id, updates) => {
    set((state) => ({
      mobs: state.mobs.map((mob) => 
        mob.id === id ? { ...mob, ...updates } : mob
      )
    }));
  },

  damageMob: (id, amount) => {
    set((state) => {
        const mob = state.mobs.find(m => m.id === id);
        if (!mob) return state;

        const newHealth = Math.max(0, mob.health - amount);
        const newState = newHealth === 0 ? 'dead' : 'hit';

        // If dead, remove after a delay (handled by component or logic) or just mark as dead
        // For now, let's just update health and state
        
        return {
            mobs: state.mobs.map(m => 
                m.id === id ? { ...m, health: newHealth, state: newState } : m
            )
        };
    });
  }
}));
