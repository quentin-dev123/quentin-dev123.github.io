import React, { useRef, useState, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useWorldStore } from '../../store';
import { useInventoryStore } from '../../store/inventory';
import { useMobStore } from '../../store/mobs';
import type { MobEntity } from '../../store/mobs';
import { checkCollision, GRAVITY } from '../../game/physics';
import { ZombieModel } from './Zombie';
import { SkeletonModel } from './Skeleton';
import { SpiderModel } from './Spider';

const MOB_SPEED = 3.5; // Slower than player
const CHASE_DISTANCE = 20;
const ATTACK_DISTANCE = 1.5;
const ATTACK_COOLDOWN = 1.0; // Seconds

interface MobControllerProps {
  mob: MobEntity;
}

export const MobController: React.FC<MobControllerProps> = ({ mob }) => {
  const { id, type, position, rotation } = mob;
  const updateMob = useMobStore(state => state.updateMob);
  const getBlock = useWorldStore(state => state.getBlock);
  
  // Player stats
  const playerHealth = useInventoryStore(state => state.health);
  const setPlayerHealth = useInventoryStore(state => state.setHealth);

  const { camera } = useThree(); // Player is camera
  
  const group = useRef<THREE.Group>(null);
  const velocity = useRef(new THREE.Vector3(0, 0, 0));
  const lastAttackTime = useRef(0);
  const isGrounded = useRef(false);

  // Local state for animation
  const [isMoving, setIsMoving] = useState(false);
  const [isAttacking, setIsAttacking] = useState(false);
  const [isHit, setIsHit] = useState(false);

  // Mob dimensions
  const radius = type === 'spider' ? 0.6 : 0.3;
  const height = type === 'spider' ? 0.8 : 1.8;
  
  const knockback = useRef(new THREE.Vector3());

  // Detect hit state change
  React.useEffect(() => {
      if (mob.state === 'hit') {
          setIsHit(true);
          
          // Apply Knockback
          if (group.current) {
              const dir = new THREE.Vector3().subVectors(group.current.position, camera.position).normalize();
              dir.y = 0.5; // Slight upward kick
              knockback.current.copy(dir).multiplyScalar(15); 
          }

          const timer = setTimeout(() => {
               updateMob(id, { state: 'chase' });
               setIsHit(false);
          }, 300);
          return () => clearTimeout(timer);
      }
  }, [mob.state, id, updateMob, camera.position]);

  useFrame((state, delta) => {
    if (!group.current) return;
    
    const dt = Math.min(delta, 0.1);
    const playerPos = camera.position;
    const mobPos = group.current.position;
    
    // 0. Apply Knockback Damping
    if (knockback.current.lengthSq() > 0.1) {
        const kbStep = knockback.current.clone().multiplyScalar(dt);
        mobPos.add(kbStep);
        knockback.current.multiplyScalar(0.9); // Friction
        
        // Simple collision check for knockback to prevent going through walls
        if (checkCollision(mobPos, getBlock, radius, height, 0)) {
            mobPos.sub(kbStep);
            knockback.current.set(0, 0, 0);
        }
    }
    
    // 1. AI Logic
    const distToPlayer = mobPos.distanceTo(playerPos);
    let moveDir = new THREE.Vector3();
    
    if (distToPlayer < CHASE_DISTANCE) {
        // Chase
        moveDir.subVectors(playerPos, mobPos).normalize();
        moveDir.y = 0; // Don't fly to player
        
        // Look at player
        const lookAtPos = new THREE.Vector3(playerPos.x, mobPos.y, playerPos.z);
        group.current.lookAt(lookAtPos);
        
        // Update rotation in store occasionally? Not needed for rendering, only for persistence if we save
    } else {
        // Idle / Wander (simplified: stand still)
        moveDir.set(0, 0, 0);
    }

    // Attack
    if (distToPlayer < ATTACK_DISTANCE) {
        if (state.clock.elapsedTime - lastAttackTime.current > ATTACK_COOLDOWN) {
            setIsAttacking(true);
            lastAttackTime.current = state.clock.elapsedTime;
            setTimeout(() => setIsAttacking(false), 500); // Animation duration
            
            // Deal damage to player
            const currentHealth = useInventoryStore.getState().health;
            setPlayerHealth(currentHealth - (type === 'spider' ? 2 : 3));
            console.log(`Mob ${type} attacked player! Health: ${currentHealth}`);
        }
        moveDir.set(0, 0, 0); // Stop moving when attacking
    }

    setIsMoving(moveDir.lengthSq() > 0.01);

    // 2. Physics & Movement
    
    // Apply Horizontal Movement
    if (moveDir.lengthSq() > 0) {
        const moveStep = moveDir.multiplyScalar(MOB_SPEED * dt);
        
        mobPos.x += moveStep.x;
        if (checkCollision(mobPos, getBlock, radius, height, 0)) {
            mobPos.x -= moveStep.x;
            // Jump if blocked?
            if (isGrounded.current) {
                velocity.current.y = 9; // Jump force
                isGrounded.current = false;
            }
        }
        
        mobPos.z += moveStep.z;
        if (checkCollision(mobPos, getBlock, radius, height, 0)) {
            mobPos.z -= moveStep.z;
             if (isGrounded.current) {
                velocity.current.y = 9;
                isGrounded.current = false;
            }
        }
    }

    // Apply Gravity
    velocity.current.y -= GRAVITY * dt;
    const oldY = mobPos.y;
    mobPos.y += velocity.current.y * dt;

    if (checkCollision(mobPos, getBlock, radius, height, 0)) {
        if (velocity.current.y < 0) {
            // Landed
            isGrounded.current = true;
            velocity.current.y = 0;
            mobPos.y = Math.floor(mobPos.y) + 1; // Snap to top of block (feet at integer) - removed eyeHeight
        } else {
            // Hit head
            velocity.current.y = 0;
            mobPos.y = oldY;
        }
    } else {
        isGrounded.current = false;
    }

    // Despawn if fell out of world
    if (mobPos.y < -50) {
        updateMob(id, { health: 0 }); // Will be removed by manager
    } else {
        // Sync position periodically (e.g. every 2s or when far from stored position)
        if (state.clock.elapsedTime % 2.0 < 0.1) {
            updateMob(id, { position: [mobPos.x, mobPos.y, mobPos.z] });
        }
    }
    
    // (Old hit logic removed)
  });

  // Initial Position
  React.useEffect(() => {
      if (group.current) {
          group.current.position.set(position[0], position[1], position[2]);
          console.log(`Mob ${type} mounted at ${position}`);
      }
  }, []);

  return (
    <group ref={group} userData={{ mobId: id, isMob: true }}>
        {type === 'zombie' && <ZombieModel isMoving={isMoving} isAttacking={isAttacking} isHit={isHit} />}
        {type === 'skeleton' && <SkeletonModel isMoving={isMoving} isAttacking={isAttacking} isHit={isHit} />}
        {type === 'spider' && <SpiderModel isMoving={isMoving} isAttacking={isAttacking} isHit={isHit} />}
        
        {/* Simple Health Bar */}
        {mob.health < mob.maxHealth && (
            <mesh position={[0, height + 0.5, 0]}>
                <planeGeometry args={[1, 0.1]} />
                <meshBasicMaterial color="red" />
                <mesh position={[0, 0, 0.01]} scale={[mob.health / mob.maxHealth, 1, 1]}  position-x={-0.5 * (1 - mob.health / mob.maxHealth)}>
                     <planeGeometry args={[1, 0.1]} />
                     <meshBasicMaterial color="green" />
                </mesh>
            </mesh>
        )}
    </group>
  );
};
