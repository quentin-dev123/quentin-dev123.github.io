import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface MobProps {
  isMoving: boolean;
  isAttacking: boolean;
  isHit: boolean;
}

export const SkeletonModel: React.FC<MobProps> = ({ isMoving, isAttacking, isHit }) => {
  const group = useRef<THREE.Group>(null);
  const leftLeg = useRef<THREE.Mesh>(null);
  const rightLeg = useRef<THREE.Mesh>(null);
  const leftArm = useRef<THREE.Group>(null);
  const rightArm = useRef<THREE.Group>(null);
  const head = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    
    // Walk animation (similar to Zombie but arms swing)
    if (isMoving) {
      const legSpeed = 10;
      const legAmp = 0.5;
      if (leftLeg.current) leftLeg.current.rotation.x = Math.sin(t * legSpeed) * legAmp;
      if (rightLeg.current) rightLeg.current.rotation.x = Math.sin(t * legSpeed + Math.PI) * legAmp;
      
      const armSpeed = 5;
      const armAmp = 0.1;
      
      // Right arm (holding bow) stays up
      if (rightArm.current) rightArm.current.rotation.x = -Math.PI / 2;
      // Left arm swings
      if (leftArm.current) leftArm.current.rotation.x = Math.sin(t * armSpeed) * armAmp;
      
    } else {
      // Idle
      if (leftLeg.current) leftLeg.current.rotation.x = THREE.MathUtils.lerp(leftLeg.current.rotation.x, 0, 0.1);
      if (rightLeg.current) rightLeg.current.rotation.x = THREE.MathUtils.lerp(rightLeg.current.rotation.x, 0, 0.1);
      
      // Right arm (holding bow) still up
      if (rightArm.current) rightArm.current.rotation.x = -Math.PI / 2 + Math.sin(t * 2) * 0.05;
      if (leftArm.current) leftArm.current.rotation.x = Math.sin(t * 2) * 0.05;
    }

    if (group.current) {
        // Hit effect (flash red)
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
    }
  });

  const boneColor = "#B0C4DE"; // Bone white

  return (
    <group ref={group} dispose={null}>
      {/* Head */}
      <mesh ref={head} position={[0, 1.5 + 0.25, 0]}>
        <boxGeometry args={[0.5, 0.5, 0.5]} />
        <meshStandardMaterial color={boneColor} roughness={0.5} metalness={0.1} />
        {/* Eye sockets (black) */}
        <mesh position={[0.1, 0.05, 0.26]}>
             <boxGeometry args={[0.1, 0.1, 0.02]} />
             <meshStandardMaterial color="black" />
        </mesh>
        <mesh position={[-0.1, 0.05, 0.26]}>
             <boxGeometry args={[0.1, 0.1, 0.02]} />
             <meshStandardMaterial color="black" />
        </mesh>
        {/* Nose */}
        <mesh position={[0, -0.05, 0.26]}>
             <boxGeometry args={[0.05, 0.05, 0.02]} />
             <meshStandardMaterial color="black" />
        </mesh>
        {/* Mouth */}
        <mesh position={[0, -0.15, 0.26]}>
             <boxGeometry args={[0.2, 0.05, 0.02]} />
             <meshStandardMaterial color="black" />
        </mesh>
      </mesh>
      
      {/* Body */}
      <mesh position={[0, 1.5 - 0.375, 0]}>
        <boxGeometry args={[0.5, 0.75, 0.25]} />
        <meshStandardMaterial color={boneColor} roughness={0.5} metalness={0.1} />
      </mesh>
      
      {/* Arms */}
      <group ref={leftArm} position={[-0.375, 1.5 - 0.125, 0]}>
          <mesh position={[0, -0.375, 0]}>
            <boxGeometry args={[0.25, 0.75, 0.25]} />
            <meshStandardMaterial color={boneColor} roughness={0.5} metalness={0.1} />
          </mesh>
      </group>
      <group ref={rightArm} position={[0.375, 1.5 - 0.125, 0]}>
          <mesh position={[0, -0.375, 0]}>
            <boxGeometry args={[0.25, 0.75, 0.25]} />
            <meshStandardMaterial color={boneColor} roughness={0.5} metalness={0.1} />
          </mesh>
          {/* Bow (simplified) - Held vertically */}
          <mesh position={[0, -0.75, 0]} rotation={[Math.PI/2, 0, 0]}>
              <boxGeometry args={[0.1, 1.2, 0.1]} />
              <meshStandardMaterial color="#5C4033" /> {/* Darker wood */}
          </mesh>
          <mesh position={[0, -0.75, 0.2]} rotation={[Math.PI/2, 0, 0]}>
              {/* String */}
              <boxGeometry args={[0.02, 1.0, 0.02]} />
              <meshStandardMaterial color="#EEEEEE" />
          </mesh>
      </group>
      
      {/* Legs */}
      <mesh ref={leftLeg} position={[-0.125, 0.75/2, 0]}>
        <boxGeometry args={[0.25, 0.75, 0.25]} />
        <meshStandardMaterial color={boneColor} roughness={0.5} metalness={0.1} />
      </mesh>
      <mesh ref={rightLeg} position={[0.125, 0.75/2, 0]}>
        <boxGeometry args={[0.25, 0.75, 0.25]} />
        <meshStandardMaterial color={boneColor} roughness={0.5} metalness={0.1} />
      </mesh>
    </group>
  );
};
