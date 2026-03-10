import React, { useEffect } from 'react';
import { useAchievementStore } from '../../store/achievements';
import { BlockIcon } from './BlockIcon';

export const AchievementToast: React.FC = () => {
  const recent = useAchievementStore(state => state.recentUnlock);
  const clearRecent = useAchievementStore(state => state.clearRecent);

  useEffect(() => {
    if (recent) {
      const timer = setTimeout(() => {
        clearRecent();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [recent, clearRecent]);

  if (!recent) return null;

  return (
    <div style={{
      position: 'absolute',
      top: 60, // Below BossBar
      right: 10,
      backgroundColor: '#222',
      border: '2px solid #ffd700', // Gold border
      padding: 10,
      width: 250,
      display: 'flex',
      alignItems: 'center',
      gap: 15,
      zIndex: 2000,
      animation: 'slideIn 0.5s ease-out',
      boxShadow: '0 5px 15px rgba(0,0,0,0.5)'
    }}>
      <style>{`
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}</style>
      
      <div style={{
          width: 48, height: 48,
          backgroundColor: '#333',
          border: '2px solid #555',
          display: 'flex', alignItems: 'center', justifyContent: 'center'
      }}>
          {typeof recent.icon === 'number' ? (
            <BlockIcon type={recent.icon} size={32} />
          ) : (
            <span style={{ fontSize: 24 }}>{recent.icon}</span>
          )}
      </div>

      <div style={{ flex: 1 }}>
          <div style={{ color: '#ffd700', fontFamily: 'monospace', fontWeight: 'bold', fontSize: 12, marginBottom: 2 }}>
              Advancement Made!
          </div>
          <div style={{ color: 'white', fontFamily: 'monospace', fontWeight: 'bold', fontSize: 14 }}>
              {recent.name}
          </div>
          <div style={{ color: '#aaa', fontFamily: 'monospace', fontSize: 10, marginTop: 2 }}>
              {recent.description}
          </div>
      </div>
    </div>
  );
};
