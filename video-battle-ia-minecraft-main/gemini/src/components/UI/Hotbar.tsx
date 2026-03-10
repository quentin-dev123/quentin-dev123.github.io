import React, { useEffect } from 'react';
import { useInventoryStore } from '../../store/inventory';
import { BlockIcon } from './BlockIcon';

const SLOT_SIZE = 40;
const HOTBAR_WIDTH = SLOT_SIZE * 9 + 20; // + padding

export const Hotbar: React.FC = () => {
  const items = useInventoryStore(state => state.items);
  const selectedSlot = useInventoryStore(state => state.selectedSlot);
  const selectSlot = useInventoryStore(state => state.selectSlot);
  
  // Handle scroll to change slot
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      if (e.deltaY > 0) {
        selectSlot((selectedSlot + 1) % 9);
      } else {
        selectSlot((selectedSlot - 1 + 9) % 9);
      }
    };
    
    // Handle number keys
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key >= '1' && e.key <= '9') {
        selectSlot(parseInt(e.key) - 1);
      }
    };

    window.addEventListener('wheel', handleWheel);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('wheel', handleWheel);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedSlot, selectSlot]);

  return (
    <div style={{
      position: 'absolute',
      bottom: 20,
      left: '50%',
      transform: 'translateX(-50%)',
      display: 'flex',
      backgroundColor: 'rgba(0, 0, 0, 0.4)', // Semi-transparent backing
      padding: 3,
      borderRadius: 2,
      border: '2px solid #333',
    }}>
      {/* Simulate the hotbar texture with CSS */}
      <div style={{
        display: 'flex',
        gap: 2
      }}>
        {Array.from({ length: 9 }).map((_, i) => {
          const item = items[i];
          const isSelected = i === selectedSlot;
          
          return (
            <div 
              key={i}
              style={{
                width: SLOT_SIZE,
                height: SLOT_SIZE,
                backgroundColor: '#8b8b8b',
                border: isSelected ? '3px solid white' : '2px solid #373737', // Active slot is white
                borderTopColor: isSelected ? 'white' : '#373737',
                borderLeftColor: isSelected ? 'white' : '#373737',
                borderBottomColor: isSelected ? 'white' : '#fff', // Inverted logic for slot depth
                borderRightColor: isSelected ? 'white' : '#fff',
                
                // Actual slot look (inner shadow)
                boxShadow: isSelected ? 'none' : 'inset 2px 2px 0 #373737, inset -2px -2px 0 #fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                imageRendering: 'pixelated'
              }}
              onClick={() => selectSlot(i)}
            >
              {item && (
                <>
                  <BlockIcon type={item.type} size={24} />
                  {item.count > 1 && (
                    <span style={{
                      position: 'absolute',
                      bottom: 2,
                      right: 2,
                      color: 'white',
                      textShadow: '2px 2px 0 #000',
                      fontSize: '12px',
                      fontFamily: 'monospace',
                      fontWeight: 'bold'
                    }}>
                      {item.count}
                    </span>
                  )}
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
