import React, { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { PointerLockControls } from '@react-three/drei';
import * as THREE from 'three';
import { useKeyboard } from '../hooks/useKeyboard';
import { useWorldStore } from '../store';
import { useInventoryStore } from '../store/inventory';
import { useMobStore } from '../store/mobs';
import { checkCollision, GRAVITY } from '../game/physics';
import { BLOCK_TYPES } from '../game/constants';

const SPEED = 8;
const JUMP_FORCE = 9;
const PLAYER_RADIUS = 0.3;
const PLAYER_HEIGHT = 1.8;
const CAMERA_HEIGHT = 1.6;

export const Player: React.FC = () => {
  const { camera, scene } = useThree();
  const { moveForward, moveBackward, moveLeft, moveRight, jump } = useKeyboard();
  const velocity = useRef(new THREE.Vector3());
  const getBlock = useWorldStore(state => state.getBlock);
  const addBlock = useWorldStore(state => state.addBlock);
  const removeBlock = useWorldStore(state => state.removeBlock);
  const damageMob = useMobStore(state => state.damageMob);
  
  const items = useInventoryStore(state => state.items);
  const selectedSlot = useInventoryStore(state => state.selectedSlot);
  const isInventoryOpen = useInventoryStore(state => state.isOpen);
  const isMenuOpen = useInventoryStore(state => state.isMenuOpen);
  
  // Stats actions
  const incrementBlockStat = useInventoryStore(state => state.incrementBlockStat);
  const incrementGeneralStat = useInventoryStore(state => state.incrementGeneralStat);

  const controlsRef = useRef<any>(null);

  // Manage Pointer Lock
  useEffect(() => {
    if (isInventoryOpen || isMenuOpen) {
        controlsRef.current?.unlock();
    } else {
        controlsRef.current?.lock();
    }
  }, [isInventoryOpen, isMenuOpen]);

  const raycaster = useRef(new THREE.Raycaster());

  const center = new THREE.Vector2(0, 0);
  const isGrounded = useRef(false);

  // Initial spawn - Find a safe spot
  useEffect(() => {
     // Start high up to fall onto terrain
    camera.position.set(0, 100, 0); 
  }, [camera]);

  const checkCollisionWrapper = (pos: THREE.Vector3) => {
    return checkCollision(pos, getBlock, PLAYER_RADIUS, PLAYER_HEIGHT, CAMERA_HEIGHT);
  };

  // Raycasting for block interaction
  useEffect(() => {
    const handleMouseDown = (e: MouseEvent) => {
      // Check for lock: pointerLockElement is on document, usually
      if (document.pointerLockElement === null) return;

      raycaster.current.setFromCamera(center, camera);
      const intersects = raycaster.current.intersectObjects(scene.children, true);
      
      const hit = intersects.find(i => i.object instanceof THREE.InstancedMesh && i.distance < 8); // Limit reach distance
      
      if (hit && hit.instanceId !== undefined) {
        // Block Interaction
        const mesh = hit.object as THREE.InstancedMesh;
        const tempMatrix = new THREE.Matrix4();
        mesh.getMatrixAt(hit.instanceId, tempMatrix);
        const position = new THREE.Vector3();
        position.setFromMatrixPosition(tempMatrix);
        
        const x = Math.floor(position.x);
        const y = Math.floor(position.y);
        const z = Math.floor(position.z);

        if (e.button === 0) { // Left Click: Remove Block
           const blockType = getBlock(x, y, z);
           if (blockType !== BLOCK_TYPES.AIR) {
               removeBlock(x, y, z);
               incrementBlockStat('mined', blockType);
           }
        } else if (e.button === 2) { // Right Click: Add Block
           // ... existing logic ...
           const normal = hit.face?.normal;
           if (normal) {
             const nx = x + Math.round(normal.x);
             const ny = y + Math.round(normal.y);
             const nz = z + Math.round(normal.z);
             
             // Don't place block inside player
             const playerPos = camera.position.clone();
             const blockBox = new THREE.Box3(new THREE.Vector3(nx, ny, nz), new THREE.Vector3(nx+1, ny+1, nz+1));
             const playerBox = new THREE.Box3(
                 new THREE.Vector3(playerPos.x - PLAYER_RADIUS, playerPos.y - CAMERA_HEIGHT, playerPos.z - PLAYER_RADIUS),
                 new THREE.Vector3(playerPos.x + PLAYER_RADIUS, playerPos.y - CAMERA_HEIGHT + PLAYER_HEIGHT, playerPos.z + PLAYER_RADIUS)
             );
             
             if (!blockBox.intersectsBox(playerBox)) {
                const item = items[selectedSlot];
                if (item) {
                   addBlock(nx, ny, nz, item.type);
                   incrementBlockStat('placed', item.type);
                }
             }
           }
        }
      } else {
          // Check for Mobs (not InstancedMesh)
          const mobHit = intersects.find(i => i.distance < 4 && !(i.object instanceof THREE.InstancedMesh));
          
          if (mobHit && e.button === 0) {
              // Traverse up to find Mob Group
              let obj: THREE.Object3D | null = mobHit.object;
              while (obj) {
                  if (obj.userData && obj.userData.isMob) {
                      const mobId = obj.userData.mobId;
                      console.log("Hit mob:", mobId);
                      damageMob(mobId, 4); // 4 damage per hit (Sword logic later)
                      // Add particle effect or sound here
                      break;
                  }
                  obj = obj.parent;
              }
          }
      }
    };

    document.addEventListener('mousedown', handleMouseDown);
    return () => document.removeEventListener('mousedown', handleMouseDown);
  }, [camera, scene, removeBlock, addBlock, getBlock, items, selectedSlot, incrementBlockStat, damageMob]);

  useFrame((state, delta) => {
    // Cap delta to avoid huge jumps on lag
    const dt = Math.min(delta, 0.1);

    // Track time
    incrementGeneralStat('time', dt);

    // Movement Logic
    const direction = new THREE.Vector3();
    const frontVector = new THREE.Vector3(0, 0, Number(moveBackward) - Number(moveForward));
    const sideVector = new THREE.Vector3(Number(moveLeft) - Number(moveRight), 0, 0);
    
    direction
      .subVectors(frontVector, sideVector)
      .normalize()
      .multiplyScalar(SPEED * dt)
      .applyEuler(camera.rotation);

    // Track distance
    if (direction.lengthSq() > 0) {
        incrementGeneralStat('distance', direction.length());
    }

    // Apply X Movement
    camera.position.x += direction.x;
    if (checkCollisionWrapper(camera.position)) {
      camera.position.x -= direction.x;
    }

    // Apply Z Movement
    camera.position.z += direction.z;
    if (checkCollisionWrapper(camera.position)) {
      camera.position.z -= direction.z;
    }

    // Apply Gravity
    velocity.current.y -= GRAVITY * dt;
    
    // Apply Y Movement
    const oldY = camera.position.y;
    camera.position.y += velocity.current.y * dt;

    if (checkCollisionWrapper(camera.position)) {
      // Collision detected on Y axis
      if (velocity.current.y < 0) {
        // Falling down - Landed
        isGrounded.current = true;
        velocity.current.y = 0;
        
        // Snap to grid top
        // Simple snap: assume we hit the floor at Math.floor(feetY)
        camera.position.y = Math.floor(camera.position.y - CAMERA_HEIGHT) + 1 + CAMERA_HEIGHT; 
        
        // Double check
        if (checkCollisionWrapper(camera.position)) {
             camera.position.y = Math.ceil(oldY - CAMERA_HEIGHT) + CAMERA_HEIGHT + 0.001;
        }
      } else {
         // Jumping up - Hit Head
         velocity.current.y = 0;
         camera.position.y = oldY;
      }
    } else {
      isGrounded.current = false;
    }

    // Jump
    if (jump && isGrounded.current) {
      velocity.current.y = JUMP_FORCE;
      isGrounded.current = false;
      incrementGeneralStat('jumps', 1);
    }

    // Reset if fell out of world
    if (camera.position.y < -30) {
      camera.position.set(0, 50, 0);
      velocity.current.set(0, 0, 0);
    }
  });

  return <PointerLockControls ref={controlsRef} />;
};
