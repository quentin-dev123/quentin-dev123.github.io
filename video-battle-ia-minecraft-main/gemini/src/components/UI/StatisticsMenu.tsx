import React, { useState } from 'react';
import { useInventoryStore } from '../../store/inventory';
import { BlockIcon } from './BlockIcon';
import { BLOCK_TYPES } from '../../game/constants';

type Tab = 'general' | 'blocks' | 'items';

const StatRow: React.FC<{ icon?: React.ReactNode; label: string; value: string | number }> = ({ icon, label, value }) => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '5px 10px', borderBottom: '1px solid #444' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {icon && <div style={{ width: 24, display: 'flex', justifyContent: 'center' }}>{icon}</div>}
        <span style={{ color: '#ccc', fontFamily: 'monospace' }}>{label}</span>
    </div>
    <span style={{ color: '#fff', fontFamily: 'monospace', fontWeight: 'bold' }}>{value}</span>
  </div>
);

const StatBar: React.FC<{ label: string; value: number; max: number; icon: React.ReactNode; color: string }> = ({ label, value, max, icon, color }) => {
    const width = Math.min(100, Math.max(0, (value / max) * 100));
    return (
        <div style={{ marginBottom: 8, display: 'flex', alignItems: 'center', gap: 10 }}>
            {icon}
            <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2, fontSize: '12px', fontFamily: 'monospace', color: '#ccc' }}>
                    <span>{label}</span>
                    <span>{value}</span>
                </div>
                <div style={{ width: '100%', height: 8, backgroundColor: '#222', border: '1px solid #555' }}>
                    <div style={{ width: `${width}%`, height: '100%', backgroundColor: color }}></div>
                </div>
            </div>
        </div>
    );
};

export const StatisticsMenu: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<Tab>('general');
  const stats = useInventoryStore(state => state.stats);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    return `${h > 0 ? h + 'h ' : ''}${m}m ${s}s`;
  };

  const formatDistance = (meters: number) => {
    if (meters > 1000) return `${(meters / 1000).toFixed(2)} km`;
    return `${meters.toFixed(1)} m`;
  };

  // Prepare Blocks Data
  const minedList = Object.entries(stats.blocksMined)
    .map(([type, count]) => ({ type: Number(type), count }))
    .sort((a, b) => b.count - a.count);
    
  const maxMined = minedList.length > 0 ? minedList[0].count : 1;

  const placedList = Object.entries(stats.blocksPlaced)
    .map(([type, count]) => ({ type: Number(type), count }))
    .sort((a, b) => b.count - a.count);

  const maxPlaced = placedList.length > 0 ? placedList[0].count : 1;

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, width: '100vw', height: '100vh',
      backgroundColor: 'rgba(0,0,0,0.85)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      zIndex: 2001 // Above pause menu
    }}>
      <div style={{
        width: 600, height: 500,
        backgroundColor: '#c6c6c6',
        border: '4px solid #fff',
        borderRightColor: '#555', borderBottomColor: '#555',
        display: 'flex', flexDirection: 'column',
        boxShadow: '10px 10px 0 rgba(0,0,0,0.5)'
      }}>
        {/* Header */}
        <div style={{ padding: 10, textAlign: 'center', borderBottom: '2px solid #555', fontSize: 20, fontFamily: 'monospace', fontWeight: 'bold' }}>
          Statistics
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', backgroundColor: '#8b8b8b', padding: 5, gap: 5 }}>
            {['general', 'blocks', 'items'].map(tab => (
                <button
                    key={tab}
                    onClick={() => setActiveTab(tab as Tab)}
                    style={{
                        flex: 1, padding: 8,
                        backgroundColor: activeTab === tab ? '#c6c6c6' : '#777',
                        border: '2px solid',
                        borderColor: activeTab === tab ? '#fff #555 #c6c6c6 #fff' : '#fff #555 #555 #fff',
                        cursor: 'pointer', fontFamily: 'monospace', textTransform: 'capitalize'
                    }}
                >
                    {tab}
                </button>
            ))}
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 20, backgroundColor: '#222' }}>
            {activeTab === 'general' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div style={{ textAlign: 'center', marginBottom: 20 }}>
                        <div style={{ fontSize: 40, color: '#4d9' }}>{formatTime(stats.timePlayed)}</div>
                        <div style={{ color: '#aaa', fontSize: 12 }}>Time Played</div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                        <div style={{ backgroundColor: '#333', padding: 15, borderRadius: 4, border: '1px solid #555' }}>
                            <div style={{ color: '#aaa', marginBottom: 5 }}>Distance Walked</div>
                            <div style={{ fontSize: 24, color: '#fff' }}>{formatDistance(stats.distanceWalked)}</div>
                            <div style={{ height: 4, width: '100%', backgroundColor: '#444', marginTop: 10 }}>
                                <div style={{ height: '100%', width: '100%', backgroundColor: '#49d' }}></div>
                            </div>
                        </div>
                        <div style={{ backgroundColor: '#333', padding: 15, borderRadius: 4, border: '1px solid #555' }}>
                            <div style={{ color: '#aaa', marginBottom: 5 }}>Jumps</div>
                            <div style={{ fontSize: 24, color: '#fff' }}>{stats.jumps}</div>
                            <div style={{ height: 4, width: '100%', backgroundColor: '#444', marginTop: 10 }}>
                                <div style={{ height: '100%', width: '100%', backgroundColor: '#d94' }}></div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'blocks' && (
                <div>
                    <h3 style={{ color: '#fff', fontFamily: 'monospace', marginTop: 0 }}>Blocks Mined</h3>
                    {minedList.length === 0 && <div style={{ color: '#777', padding: 20, textAlign: 'center' }}>No blocks mined yet.</div>}
                    {minedList.map(({ type, count }) => (
                        <StatBar 
                            key={type} 
                            label={Object.keys(BLOCK_TYPES).find(key => BLOCK_TYPES[key as keyof typeof BLOCK_TYPES] === type) || 'Unknown'} 
                            value={count} 
                            max={maxMined}
                            icon={<BlockIcon type={type} size={24} />}
                            color="#4d9"
                        />
                    ))}
                </div>
            )}

            {activeTab === 'items' && (
                <div>
                    <h3 style={{ color: '#fff', fontFamily: 'monospace', marginTop: 0 }}>Blocks Placed</h3>
                    {placedList.length === 0 && <div style={{ color: '#777', padding: 20, textAlign: 'center' }}>No blocks placed yet.</div>}
                    {placedList.map(({ type, count }) => (
                        <StatBar 
                            key={type} 
                            label={Object.keys(BLOCK_TYPES).find(key => BLOCK_TYPES[key as keyof typeof BLOCK_TYPES] === type) || 'Unknown'} 
                            value={count} 
                            max={maxPlaced}
                            icon={<BlockIcon type={type} size={24} />}
                            color="#d94"
                        />
                    ))}
                </div>
            )}
        </div>

        {/* Footer */}
        <div style={{ padding: 10, borderTop: '2px solid #555', display: 'flex', justifyContent: 'center' }}>
            <button 
                onClick={onClose}
                style={{
                    width: 200, padding: 10,
                    backgroundColor: '#777',
                    border: '2px solid #000',
                    borderTopColor: '#aaa', borderLeftColor: '#aaa', borderBottomColor: '#555', borderRightColor: '#555',
                    color: '#fff', fontFamily: 'monospace', fontWeight: 'bold', cursor: 'pointer'
                }}
            >
                Done
            </button>
        </div>
      </div>
    </div>
  );
};
