import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface MobProps {
  isMoving: boolean;
  isAttacking: boolean;
  isHit: boolean;
}

export const ZombieModel: React.FC<MobProps> = ({ isMoving, isAttacking, isHit }) => {
  const group = useRef<THREE.Group>(null);
  const leftLeg = useRef<THREE.Mesh>(null);
  const rightLeg = useRef<THREE.Mesh>(null);
  const leftArm = useRef<THREE.Group>(null);
  const rightArm = useRef<THREE.Group>(null);
  const head = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    
    if (isMoving) {
      // Walk animation
      const legSpeed = 10;
      const legAmp = 0.5;
      if (leftLeg.current) leftLeg.current.rotation.x = Math.sin(t * legSpeed) * legAmp;
      if (rightLeg.current) rightLeg.current.rotation.x = Math.sin(t * legSpeed + Math.PI) * legAmp;
      
      // Arms (Zombies hold arms forward)
      const armSpeed = 5;
      const armAmp = 0.1;
      const baseArmRot = -Math.PI / 2; // Arms forward
      
      if (leftArm.current) leftArm.current.rotation.x = baseArmRot + Math.sin(t * armSpeed) * armAmp;
      if (rightArm.current) rightArm.current.rotation.x = baseArmRot + Math.sin(t * armSpeed + Math.PI) * armAmp;
      
    } else {
      // Idle
      if (leftLeg.current) leftLeg.current.rotation.x = THREE.MathUtils.lerp(leftLeg.current.rotation.x, 0, 0.1);
      if (rightLeg.current) rightLeg.current.rotation.x = THREE.MathUtils.lerp(rightLeg.current.rotation.x, 0, 0.1);
      
      const baseArmRot = -Math.PI / 2;
      const breathe = Math.sin(t * 2) * 0.05;
      if (leftArm.current) leftArm.current.rotation.x = baseArmRot + breathe;
      if (rightArm.current) rightArm.current.rotation.x = baseArmRot - breathe;
    }
    
    if (isAttacking) {
        // Attack animation (simple lunge or arm swing)
        // For now let's just make arms shake more violently
        if (leftArm.current) leftArm.current.rotation.x -= 0.5 * Math.sin(t * 20);
        if (rightArm.current) rightArm.current.rotation.x -= 0.5 * Math.sin(t * 20);
    }

    if (group.current) {
        // Hit effect (flash red)
        group.current.traverse((child) => {
            if (child instanceof THREE.Mesh) {
                const material = child.material as THREE.MeshStandardMaterial;
                
                // Store original color if not stored
                if (!child.userData.originalColor) {
                    child.userData.originalColor = material.color.getHex();
                }

                if (isHit) {
                    material.color.setHex(0xff0000);
                } else {
                    // Restore original color
                    material.color.setHex(child.userData.originalColor);
                }
            }
        });
    }
  });

  const skinColor = "#2E8B57"; // Zombie Green
  const shirtColor = "#0000CD"; // MediumBlue
  const pantsColor = "#4B0082"; // Indigo

  return (
    <group ref={group} dispose={null}>
      {/* Head */}
      <mesh ref={head} position={[0, 1.5 + 0.25, 0]}>
        <boxGeometry args={[0.5, 0.5, 0.5]} />
        <meshStandardMaterial color={skinColor} roughness={0.8} metalness={0.1} />
        {/* Face details */}
        <mesh position={[0.1, 0.05, 0.26]}>
            <boxGeometry args={[0.08, 0.08, 0.05]} />
            <meshStandardMaterial color="black" />
        </mesh>
        <mesh position={[-0.1, 0.05, 0.26]}>
            <boxGeometry args={[0.08, 0.08, 0.05]} />
            <meshStandardMaterial color="black" />
        </mesh>
        {/* Mouth/Nose area? Simplified */}
        <mesh position={[0, -0.1, 0.26]}>
             <boxGeometry args={[0.2, 0.05, 0.05]} />
             <meshStandardMaterial color="#556B2F" />
        </mesh>
      </mesh>
      
      {/* Body */}
      <mesh position={[0, 1.5 - 0.375, 0]}>
        <boxGeometry args={[0.5, 0.75, 0.25]} />
        <meshStandardMaterial color={shirtColor} roughness={0.8} metalness={0.1} />
      </mesh>
      
      {/* Arms */}
      <group ref={leftArm} position={[-0.375, 1.5 - 0.125, 0]}>
          <mesh position={[0, -0.375, 0]}>
            <boxGeometry args={[0.25, 0.75, 0.25]} />
            <meshStandardMaterial color={skinColor} roughness={0.8} metalness={0.1} />
          </mesh>
      </group>
      <group ref={rightArm} position={[0.375, 1.5 - 0.125, 0]}>
          <mesh position={[0, -0.375, 0]}>
            <boxGeometry args={[0.25, 0.75, 0.25]} />
            <meshStandardMaterial color={skinColor} roughness={0.8} metalness={0.1} />
          </mesh>
      </group>
      
      {/* Legs */}
      <mesh ref={leftLeg} position={[-0.125, 0.75/2, 0]}>
        <boxGeometry args={[0.25, 0.75, 0.25]} />
        <meshStandardMaterial color={pantsColor} roughness={0.8} metalness={0.1} />
      </mesh>
      <mesh ref={rightLeg} position={[0.125, 0.75/2, 0]}>
        <boxGeometry args={[0.25, 0.75, 0.25]} />
        <meshStandardMaterial color={pantsColor} roughness={0.8} metalness={0.1} />
      </mesh>
    </group>
  );
};
