import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface MobProps {
  isMoving: boolean;
  isAttacking: boolean;
  isHit: boolean;
}

export const SpiderModel: React.FC<MobProps> = ({ isMoving, isAttacking, isHit }) => {
  const group = useRef<THREE.Group>(null);
  
  // Create refs for legs (we'll just use an array of refs or similar structure in a real app, 
  // but here I'll manually animate them in useFrame by traversing or just use a simple sway)
  
  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    
    if (group.current) {
        // Hit effect
        group.current.traverse((child) => {
            if (child instanceof THREE.Mesh) {
                const material = child.material as THREE.MeshStandardMaterial;
                
                if (!child.userData.originalColor) {
                    child.userData.originalColor = material.color.getHex();
                }

                if (isHit) {
                    material.color.setHex(0xff0000);
                } else {
                    material.color.setHex(child.userData.originalColor);
                }
            }
        });

        // Leg animation
        if (isMoving) {
            group.current.children.forEach((child, index) => {
                if (child.name.startsWith('leg')) {
                    const legIndex = parseInt(child.name.replace('leg', ''));
                    // Alternate legs
                    const offset = legIndex % 2 === 0 ? 0 : Math.PI;
                    const speed = 15;
                    const amp = 0.2;
                    child.rotation.z = Math.sin(t * speed + offset) * amp;
                    child.rotation.y = (child.userData.baseRotY || 0) + Math.cos(t * speed + offset) * 0.1;
                }
            });
        }
    }
  });

  const spiderColor = "#1a1a1a"; 

  // Generate legs
  const legs = [];
  for (let i = 0; i < 8; i++) {
      const isLeft = i < 4;
      const sideIndex = i % 4;
      const zOffset = (sideIndex - 1.5) * 0.4;
      const xOffset = isLeft ? -0.4 : 0.4;
      const baseRotY = isLeft ? Math.PI / 4 * (sideIndex - 1.5) : -Math.PI / 4 * (sideIndex - 1.5);
      
      legs.push(
          <group 
            key={i} 
            name={`leg${i}`} 
            position={[xOffset, 0.4, zOffset]} 
            userData={{ baseRotY }}
            rotation={[0, 0, isLeft ? Math.PI/6 : -Math.PI/6]}
          >
              <mesh position={[isLeft ? -0.4 : 0.4, -0.2, 0]} rotation={[0, 0, isLeft ? -Math.PI/4 : Math.PI/4]}>
                <boxGeometry args={[0.8, 0.1, 0.1]} />
                <meshStandardMaterial color={spiderColor} />
              </mesh>
          </group>
      );
  }

  return (
    <group ref={group} dispose={null}>
      {/* Head */}
      <mesh position={[0, 0.4, -0.6]}>
        <boxGeometry args={[0.6, 0.5, 0.6]} />
        <meshStandardMaterial color={spiderColor} />
      </mesh>
      
      {/* Abdomen */}
      <mesh position={[0, 0.5, 0.4]}>
        <boxGeometry args={[0.9, 0.7, 1.0]} />
        <meshStandardMaterial color={spiderColor} />
      </mesh>
      
      {/* Neck/Connector */}
      <mesh position={[0, 0.4, -0.1]}>
         <boxGeometry args={[0.4, 0.3, 0.4]} />
         <meshStandardMaterial color={spiderColor} />
      </mesh>
      
      {/* Legs */}
      {legs}
      
      {/* Eyes */}
      <group position={[0, 0.5, -0.9]}>
          <mesh position={[0.15, 0, 0]}>
              <boxGeometry args={[0.1, 0.1, 0.05]} />
              <meshStandardMaterial color="red" emissive="red" emissiveIntensity={0.5} />
          </mesh>
          <mesh position={[-0.15, 0, 0]}>
              <boxGeometry args={[0.1, 0.1, 0.05]} />
              <meshStandardMaterial color="red" emissive="red" emissiveIntensity={0.5} />
          </mesh>
          <mesh position={[0.08, 0.1, -0.01]}>
              <boxGeometry args={[0.05, 0.05, 0.05]} />
              <meshStandardMaterial color="red" emissive="red" emissiveIntensity={0.5} />
          </mesh>
          <mesh position={[-0.08, 0.1, -0.01]}>
              <boxGeometry args={[0.05, 0.05, 0.05]} />
              <meshStandardMaterial color="red" emissive="red" emissiveIntensity={0.5} />
          </mesh>
      </group>
    </group>
  );
};
