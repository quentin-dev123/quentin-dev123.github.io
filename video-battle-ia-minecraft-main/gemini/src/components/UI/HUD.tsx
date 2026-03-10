import React, { useEffect, useRef } from 'react';
import { useInventoryStore } from '../../store/inventory';

const HEART_FULL = [
  "01100110",
  "11111111",
  "11111111",
  "11111111",
  "01111110",
  "00111100",
  "00011000",
  "00000000"
];

const FOOD_FULL = [
  "00011100",
  "00111110",
  "01111100",
  "11111100",
  "11111100",
  "01111000",
  "00110000",
  "00000000"
];

const drawIcon = (ctx: CanvasRenderingContext2D, pattern: string[], color: string, xOffset: number = 0) => {
  ctx.fillStyle = color;
  pattern.forEach((row, y) => {
    for (let x = 0; x < row.length; x++) {
      if (row[x] === '1') {
        ctx.fillRect(x * 2 + xOffset, y * 2, 2, 2); // Scale up 2x
      }
    }
  });
};

const StatusIcon: React.FC<{ type: 'heart' | 'food', value: number, index: number }> = ({ type, value, index }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, 18, 18);

    // Background (empty)
    // Draw outline
    // For now, simple logic:
    // value is total health (e.g. 15).
    // index is heart index (0-9).
    // Each heart represents 2 units.
    
    const heartValue = index * 2;
    let state = 'empty';
    if (value >= heartValue + 2) state = 'full';
    else if (value >= heartValue + 1) state = 'half';

    // Draw background (black outline usually)
    // Simplified for now: Red heart or Empty
    if (type === 'heart') {
       if (state === 'full') drawIcon(ctx, HEART_FULL, '#ff0000');
       else if (state === 'half') drawIcon(ctx, HEART_FULL, '#ff0000'); // TODO: half
       else {
         // Empty heart outline
         drawIcon(ctx, HEART_FULL, '#440000'); // Dark red placeholder
       }
    } else {
       if (state === 'full') drawIcon(ctx, FOOD_FULL, '#cf752b');
       else if (state === 'half') drawIcon(ctx, FOOD_FULL, '#cf752b');
       else drawIcon(ctx, FOOD_FULL, '#4a2a0f');
    }

  }, [type, value, index]);

  return <canvas ref={canvasRef} width={18} height={18} style={{ display: 'block' }} />;
};

export const HUD: React.FC = () => {
  const { health, food } = useInventoryStore();

  return (
    <div style={{
      position: 'absolute',
      bottom: 80, // Moved up from 60
      left: '50%',
      transform: 'translateX(-50%)',
      width: 382, // Matches hotbar width more closely
      display: 'flex',
      justifyContent: 'space-between',
      pointerEvents: 'none'
    }}>
      {/* Health (Left) */}
      <div style={{ display: 'flex' }}>
        {Array.from({ length: 10 }).map((_, i) => (
          <StatusIcon key={i} type="heart" value={health} index={i} />
        ))}
      </div>

      {/* Food (Right) */}
      <div style={{ display: 'flex', flexDirection: 'row-reverse' }}>
        {Array.from({ length: 10 }).map((_, i) => (
          <StatusIcon key={i} type="food" value={food} index={i} />
        ))}
      </div>
    </div>
  );
};
