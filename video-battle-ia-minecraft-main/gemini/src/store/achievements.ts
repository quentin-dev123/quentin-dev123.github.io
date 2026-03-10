import { create } from 'zustand';
import { ACHIEVEMENTS, type Achievement } from '../data/achievementsList';

interface AchievementState {
  unlocked: Set<string>;
  recentUnlock: Achievement | null; // For toast
  
  unlock: (id: string) => void;
  clearRecent: () => void;
  reset: () => void;
}

export const useAchievementStore = create<AchievementState>((set, get) => ({
  unlocked: new Set(['root']), // Root unlocked by default
  recentUnlock: null,

  unlock: (id) => {
    const { unlocked } = get();
    if (unlocked.has(id)) return;

    const achievement = ACHIEVEMENTS.find(a => a.id === id);
    if (!achievement) return;

    // Check parent (optional constraint, usually implied by game logic but good for structure)
    if (achievement.parent && !unlocked.has(achievement.parent)) return;

    set((state) => {
        const newSet = new Set(state.unlocked);
        newSet.add(id);
        return { 
            unlocked: newSet,
            recentUnlock: achievement
        };
    });
  },

  clearRecent: () => set({ recentUnlock: null }),
  
  reset: () => set({ unlocked: new Set(['root']), recentUnlock: null }),
}));
