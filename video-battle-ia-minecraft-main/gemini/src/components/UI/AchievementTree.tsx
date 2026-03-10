import React, { useRef, useEffect, useState } from 'react';
import { useAchievementStore } from '../../store/achievements';
import { ACHIEVEMENTS, type Achievement } from '../../data/achievementsList';
import { BlockIcon } from './BlockIcon';

const ICON_SIZE = 48;

const AchievementNode: React.FC<{ achievement: Achievement, unlocked: boolean }> = ({ achievement, unlocked }) => {
  return (
    <div
      title={`${achievement.name}: ${achievement.description}`}
      style={{
        position: 'absolute',
        left: achievement.x,
        top: achievement.y,
        width: ICON_SIZE,
        height: ICON_SIZE,
        backgroundColor: unlocked ? '#50a14f' : '#333',
        border: `4px solid ${unlocked ? '#ffd700' : '#555'}`,
        borderRadius: 4,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transform: 'translate(-50%, -50%)',
        boxShadow: unlocked ? '0 0 15px rgba(255, 215, 0, 0.5)' : 'none',
        transition: 'all 0.3s ease',
        cursor: 'help',
        zIndex: 2
      }}
    >
      {typeof achievement.icon === 'number' ? (
        <BlockIcon type={achievement.icon} size={32} />
      ) : (
        <span style={{ fontSize: 24, filter: unlocked ? 'none' : 'grayscale(100%)' }}>{achievement.icon}</span>
      )}
      
      {/* Tooltip on hover could be handled by parent or simple title for now */}
    </div>
  );
};

export const AchievementTree: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const unlocked = useAchievementStore(state => state.unlocked);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Center view on mount (simplified: center on root usually at 0,0)
  // We'll translate the inner container
  
  // Draw lines
  const lines = ACHIEVEMENTS.map(ach => {
    if (!ach.parent) return null;
    const parent = ACHIEVEMENTS.find(p => p.id === ach.parent);
    if (!parent) return null;

    const isUnlocked = unlocked.has(ach.id);
    const isParentUnlocked = unlocked.has(parent.id);
    const color = isUnlocked ? '#ffd700' : (isParentUnlocked ? '#aaa' : '#333');
    const width = isUnlocked ? 4 : 2;

    return (
        <line
            key={`${parent.id}-${ach.id}`}
            x1={parent.x}
            y1={parent.y}
            x2={ach.x}
            y2={ach.y}
            stroke={color}
            strokeWidth={width}
            strokeDasharray={!isUnlocked && isParentUnlocked ? "5,5" : "none"}
        />
    );
  });

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, width: '100vw', height: '100vh',
      backgroundColor: 'rgba(0,0,0,0.9)',
      zIndex: 3000,
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden'
    }}>
      <div style={{
          padding: 20,
          textAlign: 'center',
          color: 'white',
          fontSize: 32,
          fontFamily: 'monospace',
          textShadow: '4px 4px 0 #000',
          zIndex: 10,
          backgroundColor: '#222',
          borderBottom: '4px solid #555'
      }}>
          Advancements
      </div>

      <div 
        ref={containerRef}
        style={{
            flex: 1,
            position: 'relative',
            overflow: 'auto',
            backgroundImage: 'radial-gradient(#333 1px, transparent 1px)',
            backgroundSize: '20px 20px', // Grid pattern
            backgroundColor: '#1a1a1a',
            cursor: 'grab'
        }}
      >
        <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: 0, height: 0, // Origin point
            overflow: 'visible'
        }}>
            <svg style={{ position: 'absolute', top: -1000, left: -1000, width: 2000, height: 2000, pointerEvents: 'none' }}>
                {lines}
            </svg>

            {ACHIEVEMENTS.map(ach => (
                <AchievementNode 
                    key={ach.id} 
                    achievement={ach} 
                    unlocked={unlocked.has(ach.id)} 
                />
            ))}
        </div>
      </div>

      <div style={{ padding: 20, textAlign: 'center', pointerEvents: 'none' }}>
          <button 
            onClick={onClose}
            style={{
                pointerEvents: 'auto',
                padding: '10px 30px',
                fontSize: 20,
                fontFamily: 'monospace',
                backgroundColor: '#777',
                border: '4px solid #fff',
                color: 'white',
                cursor: 'pointer'
            }}
          >
              Done
          </button>
      </div>
    </div>
  );
};
