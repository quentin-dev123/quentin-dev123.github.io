import React, { useState } from 'react';
import { useInventoryStore } from '../../store/inventory';
import { StatisticsMenu } from './StatisticsMenu';
import { AchievementTree } from './AchievementTree';

const Button: React.FC<{ children: React.ReactNode, onClick: () => void, width?: number }> = ({ children, onClick, width = 400 }) => (
  <button
    onClick={onClick}
    style={{
      width: width,
      height: 40,
      backgroundColor: '#777',
      border: '2px solid #000',
      borderTopColor: '#aaa',
      borderLeftColor: '#aaa',
      borderBottomColor: '#555',
      borderRightColor: '#555',
      color: '#fff',
      fontFamily: 'monospace',
      fontSize: '16px',
      textShadow: '2px 2px 0 #333',
      cursor: 'pointer',
      marginBottom: 10,
      imageRendering: 'pixelated'
    }}
    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#889'}
    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#777'}
  >
    {children}
  </button>
);

export const PauseMenu: React.FC = () => {
  const { isMenuOpen, toggleMenu } = useInventoryStore();
  const [activeMenu, setActiveMenu] = useState<'main' | 'stats' | 'achievements'>('main');

  if (!isMenuOpen) {
      if (activeMenu !== 'main') setActiveMenu('main');
      return null;
  }

  if (activeMenu === 'stats') {
      return <StatisticsMenu onClose={() => setActiveMenu('main')} />;
  }

  if (activeMenu === 'achievements') {
      return <AchievementTree onClose={() => setActiveMenu('main')} />;
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      backgroundColor: 'rgba(0,0,0,0.6)',
      backdropFilter: 'blur(2px)',
      zIndex: 2000,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <h1 style={{ color: '#fff', textShadow: '4px 4px 0 #333', marginBottom: 40, fontFamily: 'monospace' }}>Game Menu</h1>
      
      <Button onClick={toggleMenu}>Back to Game</Button>
      <Button onClick={() => setActiveMenu('achievements')}>Advancements</Button>
      <Button onClick={() => setActiveMenu('stats')}>Statistics</Button>
      <Button onClick={() => alert("Options not implemented")}>Options</Button>
      <Button onClick={() => window.location.reload()}>Save and Quit to Title</Button>
    </div>
  );
};
