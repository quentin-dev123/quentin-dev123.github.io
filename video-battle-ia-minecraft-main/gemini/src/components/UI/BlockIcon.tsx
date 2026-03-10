import React, { useEffect, useRef } from 'react';
import { getTextureForBlock } from '../../utils/textureMapping';
import { getTextureCanvas } from '../../textures/TextureFactory';

interface BlockIconProps {
  type: number;
  size?: number;
}

export const BlockIcon: React.FC<BlockIconProps> = ({ type, size = 32 }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (canvasRef.current) {
      const textureType = getTextureForBlock(type);
      const sourceCanvas = getTextureCanvas(textureType);
      
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) {
        ctx.imageSmoothingEnabled = false;
        ctx.clearRect(0, 0, size, size);
        ctx.drawImage(sourceCanvas, 0, 0, size, size);
        
        // Add pseudo-3D effect for "item" look (simple shading)
        // Only if it's a solid block (simple heuristic)
        // For now, flat is fine, or maybe a slight drop shadow via CSS
      }
    }
  }, [type, size]);

  return (
    <canvas 
      ref={canvasRef} 
      width={size} 
      height={size} 
      style={{ imageRendering: 'pixelated' }}
    />
  );
};
