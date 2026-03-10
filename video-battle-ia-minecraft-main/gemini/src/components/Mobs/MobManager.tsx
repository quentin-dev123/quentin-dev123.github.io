import React, { useEffect } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import { useMobStore } from '../../store/mobs';
import type { MobType } from '../../store/mobs';
import { useWorldStore } from '../../store';
import { MobController } from './MobController';
import { BLOCK_TYPES, isSolid } from '../../game/constants';
import * as THREE from 'three';

const MAX_MOBS = 20;
const SPAWN_RADIUS_MIN = 10;
const SPAWN_RADIUS_MAX = 30;
const DESPAWN_DISTANCE = 100; // Increased to avoid premature despawn
const CHECK_INTERVAL = 1.0; // Check more often

export const MobManager: React.FC = () => {
  const mobs = useMobStore(state => state.mobs);
  const spawnMob = useMobStore(state => state.spawnMob);
  const removeMob = useMobStore(state => state.removeMob);
  const getBlock = useWorldStore(state => state.getBlock);
  const { camera } = useThree();
  
  // Timer for spawning logic
  const lastCheck = React.useRef(0);

  // DEBUG: Spawn a test mob immediately
  useEffect(() => {
      console.log("MobManager mounted. Spawning test zombie at 0, 80, 5");
      spawnMob('zombie', [5, 80, 5]); // Should fall with player
  }, []);

  useFrame((state) => {
    if (state.clock.elapsedTime - lastCheck.current < CHECK_INTERVAL) return;
    lastCheck.current = state.clock.elapsedTime;

    const playerPos = camera.position;

    // 1. Despawn far mobs
    mobs.forEach(mob => {
        const mobPos = new THREE.Vector3(...mob.position);
        const dist = mobPos.distanceTo(playerPos);
        if (dist > DESPAWN_DISTANCE || mob.health <= 0) {
            console.log(`Despawning mob ${mob.type} at dist ${dist} (health: ${mob.health})`); // DEBUG
            removeMob(mob.id);
        }
    });

    // 2. Spawn new mobs
    if (mobs.length < MAX_MOBS) {
        // console.log("Attempting spawn..."); // DEBUG
        attemptSpawn(playerPos);
    }
  });

  const attemptSpawn = (playerPos: THREE.Vector3) => {
      // Random angle and distance
      const angle = Math.random() * Math.PI * 2;
      const dist = SPAWN_RADIUS_MIN + Math.random() * (SPAWN_RADIUS_MAX - SPAWN_RADIUS_MIN);
      
      const x = Math.floor(playerPos.x + Math.cos(angle) * dist);
      const z = Math.floor(playerPos.z + Math.sin(angle) * dist);
      
      // Find ground y
      // Scan from high up to down
      let y = Math.floor(playerPos.y + 20); // Start higher
      let foundGround = false;
      
      // Vertical scan larger range
      for (let i = 0; i < 50; i++) {
          const block = getBlock(x, y, z);
          const blockBelow = getBlock(x, y - 1, z);
          
          // console.log(`Scanning ${x}, ${y}, ${z}: ${block}, below: ${blockBelow}`); // Too verbose
          
          if (block === BLOCK_TYPES.AIR && blockBelow !== BLOCK_TYPES.AIR && isSolid(blockBelow)) {
              foundGround = true;
              break;
          }
          y--;
      }

      if (foundGround) {
          // Determine mob type
          const rand = Math.random();
          let type: MobType = 'zombie';
          if (rand > 0.7) type = 'skeleton';
          if (rand > 0.9) type = 'spider';
          
          console.log(`Spawning ${type} at ${x}, ${y}, ${z}`); // DEBUG log
          spawnMob(type, [x + 0.5, y + 0.1, z + 0.5]);
      } else {
          // console.log(`Failed to find ground at ${x}, ${z}`); // DEBUG log
      }
  };

  return (
    <>
      {mobs.map(mob => (
        <MobController key={mob.id} mob={mob} />
      ))}
    </>
  );
};
