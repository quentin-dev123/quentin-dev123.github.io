import * as THREE from 'three';
import { BLOCK_TYPES, isSolid } from './constants';

export const GRAVITY = 25;

export const checkCollision = (
  pos: THREE.Vector3, 
  getBlock: (x: number, y: number, z: number) => number,
  radius: number = 0.3,
  height: number = 1.8,
  eyeHeight: number = 1.6
) => {
  const feetY = pos.y - eyeHeight;
  
  // Determine the grid cells the entity overlaps with
  const xMin = Math.floor(pos.x - radius);
  const xMax = Math.floor(pos.x + radius);
  const zMin = Math.floor(pos.z - radius);
  const zMax = Math.floor(pos.z + radius);
  
  // Check height range (feet to top of head)
  const yMin = Math.floor(feetY);
  const yMax = Math.floor(feetY + height - 0.01);

  for (let x = xMin; x <= xMax; x++) {
    for (let z = zMin; z <= zMax; z++) {
      for (let y = yMin; y <= yMax; y++) {
        const block = getBlock(x, y, z);
        // Check collision with solid blocks
        if (block !== BLOCK_TYPES.AIR && isSolid(block)) {
          return true;
        }
      }
    }
  }
  return false;
};
