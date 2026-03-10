import React, { useState } from 'react';
import { useInventoryStore, type ItemStack } from '../../store/inventory';
import { BlockIcon } from './BlockIcon';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { PlayerSkin } from '../Player/PlayerSkin';

const SLOT_SIZE = 36;
const GAP = 4;

const InventorySlot: React.FC<{
  item: ItemStack | null;
  onClick: () => void;
  onRightClick: (e: React.MouseEvent) => void;
  isSelected?: boolean;
}> = ({ item, onClick, onRightClick, isSelected }) => (
  <div 
    onMouseDown={(e) => {
      if (e.button === 0) onClick();
      if (e.button === 2) onRightClick(e);
    }}
    onContextMenu={(e) => e.preventDefault()}
    style={{
      width: SLOT_SIZE,
      height: SLOT_SIZE,
      backgroundColor: '#8b8b8b',
      border: '2px solid #373737',
      borderTopColor: '#373737',
      borderLeftColor: '#373737',
      borderBottomColor: '#fff',
      borderRightColor: '#fff',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      cursor: 'pointer',
      boxShadow: isSelected ? 'inset 0 0 0 2px blue' : 'none', // Debug selection
      imageRendering: 'pixelated'
    }}
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

export const Inventory: React.FC = () => {
  const { items, isOpen, toggleInventory, setSlot } = useInventoryStore();
  
  // Local state for "held" item (cursor item)
  const [cursorItem, setCursorItem] = useState<ItemStack | null>(null);

  if (!isOpen) return null;

  const handleSlotClick = (index: number) => {
    const clickedItem = items[index];
    
    if (cursorItem) {
      // Place item
      if (!clickedItem) {
        // Empty slot, place all
        setSlot(index, cursorItem);
        setCursorItem(null);
      } else if (clickedItem.type === cursorItem.type) {
        // Same type, stack
        const space = 64 - clickedItem.count;
        const toAdd = Math.min(space, cursorItem.count);
        
        setSlot(index, { ...clickedItem, count: clickedItem.count + toAdd });
        
        if (cursorItem.count - toAdd > 0) {
          setCursorItem({ ...cursorItem, count: cursorItem.count - toAdd });
        } else {
          setCursorItem(null);
        }
      } else {
        // Different type, swap
        setSlot(index, cursorItem);
        setCursorItem(clickedItem);
      }
    } else {
      // Pick up item
      if (clickedItem) {
        setCursorItem(clickedItem);
        setSlot(index, null);
      }
    }
  };

  const handleRightClick = (index: number) => {
    // Logic for splitting stack (simplified for now: just take half)
    const clickedItem = items[index];
    if (!cursorItem && clickedItem && clickedItem.count > 1) {
      const half = Math.ceil(clickedItem.count / 2);
      setCursorItem({ ...clickedItem, count: half });
      setSlot(index, { ...clickedItem, count: clickedItem.count - half });
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      backgroundColor: 'rgba(0,0,0,0.7)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        width: 176 * 2.5, // Scale up for modern screens
        height: 166 * 2.5,
        backgroundColor: '#c6c6c6',
        border: '4px solid #fff',
        borderRightColor: '#555',
        borderBottomColor: '#555',
        padding: 20,
        position: 'relative',
        display: 'grid',
        gridTemplateRows: 'auto 1fr auto',
        gap: 20,
        imageRendering: 'pixelated',
        boxShadow: '10px 10px 0 rgba(0,0,0,0.5)'
      }}>
        {/* Top Section: Crafting and Character */}
        <div style={{ display: 'flex', justifyContent: 'space-between', height: 150 }}>
            {/* Character Preview (3D Model) */}
            <div style={{ width: 100, height: 140, backgroundColor: '#000', border: '2px solid #555', position: 'relative' }}>
                <Canvas camera={{ position: [0, 0, 3], fov: 40 }}>
                    <ambientLight intensity={0.7} />
                    <directionalLight position={[2, 2, 5]} intensity={1} />
                    <pointLight position={[-2, -2, 2]} intensity={0.5} />
                    
                    <PlayerSkin />
                    
                    <OrbitControls 
                        enableZoom={false} 
                        enablePan={false} 
                        minPolarAngle={Math.PI / 3} 
                        maxPolarAngle={Math.PI / 1.5}
                        autoRotate
                        autoRotateSpeed={2}
                    />
                </Canvas>
            </div>

            {/* Crafting 2x2 */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div>Crafting</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                    {[0, 1, 2, 3].map(i => (
                        <div key={i} style={{ width: SLOT_SIZE, height: SLOT_SIZE, backgroundColor: '#8b8b8b', border: '2px solid #373737' }}></div>
                    ))}
                </div>
            </div>
        </div>

        {/* Main Inventory (Middle 27) */}
        <div>
           <div style={{ marginBottom: 5 }}>Inventory</div>
           <div style={{ display: 'grid', gridTemplateColumns: 'repeat(9, 1fr)', gap: GAP }}>
             {/* Slots 9-35 (Main Inventory) */}
             {items.slice(9, 36).map((item, i) => (
               <InventorySlot 
                 key={i + 9} 
                 item={item} 
                 onClick={() => handleSlotClick(i + 9)}
                 onRightClick={() => handleRightClick(i + 9)}
               />
             ))}
           </div>
        </div>

        {/* Hotbar (Bottom 9) */}
        <div>
           <div style={{ display: 'grid', gridTemplateColumns: 'repeat(9, 1fr)', gap: GAP, marginTop: 10 }}>
             {items.slice(0, 9).map((item, i) => (
               <InventorySlot 
                 key={i} 
                 item={item} 
                 onClick={() => handleSlotClick(i)}
                 onRightClick={() => handleRightClick(i)}
               />
             ))}
           </div>
        </div>

        {/* Cursor Item (Floating) */}
        {cursorItem && (
           <div style={{
             position: 'fixed',
             pointerEvents: 'none',
             left: 0, // Should follow mouse
             top: 0,
             zIndex: 2000,
             transform: 'translate(15px, 15px)' // Offset
           }}
           ref={el => {
               if (el) {
                   const move = (e: MouseEvent) => {
                       el.style.left = e.clientX + 'px';
                       el.style.top = e.clientY + 'px';
                   };
                   window.addEventListener('mousemove', move);
                   // Clean up is hard in ref callback without effect, but this component unmounts when inventory closes
               }
           }}
           >
              <BlockIcon type={cursorItem.type} size={32} />
              <span style={{
                  position: 'absolute',
                  bottom: 0,
                  right: 0,
                  color: 'white',
                  textShadow: '2px 2px 0 #000',
                  fontWeight: 'bold'
              }}>{cursorItem.count}</span>
           </div>
        )}
      </div>
    </div>
  );
};
