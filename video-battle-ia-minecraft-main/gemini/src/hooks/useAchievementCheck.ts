import { useEffect } from 'react';
import { useInventoryStore } from '../store/inventory';
import { useAchievementStore } from '../store/achievements';
import { ACHIEVEMENTS } from '../data/achievementsList';

export const useAchievementCheck = () => {
  const stats = useInventoryStore(state => state.stats);
  const unlock = useAchievementStore(state => state.unlock);
  const unlocked = useAchievementStore(state => state.unlocked);

  useEffect(() => {
    // console.log("Stats update:", stats);
    if (Math.random() > 0.95) console.log("Checking achvs, stats:", stats); // Sample logging to avoid spam
    // Check all achievements
    ACHIEVEMENTS.forEach(achievement => {
      if (unlocked.has(achievement.id)) return;

      // Check if parent is unlocked (prerequisite)
      if (achievement.parent && !unlocked.has(achievement.parent)) return;

      // Check condition
      if (achievement.condition(stats)) {
        unlock(achievement.id);
      }
    });
  }, [stats, unlock, unlocked]);
};
