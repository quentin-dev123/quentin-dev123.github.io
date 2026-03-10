import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export const PlayerSkin: React.FC = () => {
  const group = useRef<THREE.Group>(null);
  
  // Animation refs
  const leftArm = useRef<THREE.Mesh>(null);
  const rightArm = useRef<THREE.Mesh>(null);
  const leftLeg = useRef<THREE.Mesh>(null);
  const rightLeg = useRef<THREE.Mesh>(null);
  const head = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (!group.current) return;
    const time = state.clock.getElapsedTime();

    // Idle breathing
    group.current.position.y = Math.sin(time * 2) * 0.02 - 0.2; // Adjusted to be more visible

    // Idle sway
    if (leftArm.current) leftArm.current.rotation.x = Math.sin(time * 1.5) * 0.05;
    if (rightArm.current) rightArm.current.rotation.x = -Math.sin(time * 1.5) * 0.05;
    
    // Slight head bob
    if (head.current) {
        head.current.rotation.y = Math.sin(time * 0.5) * 0.1;
        head.current.rotation.x = Math.sin(time * 0.3) * 0.05;
    }
  });

  // Steve Colors
  const SKIN_COLOR = "#d9a066";
  const SHIRT_COLOR = "#00b8b8"; // Cyan
  const PANTS_COLOR = "#2e3a96"; // Dark Blue
  const HAIR_COLOR = "#4a2a0f"; // Brown

  return (
    <group ref={group} dispose={null}>
      {/* Head Group */}
      <group ref={head} position={[0, 0.75, 0]}>
        {/* Main Head Box */}
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[0.5, 0.5, 0.5]} />
          <meshStandardMaterial color={SKIN_COLOR} />
        </mesh>
        {/* Hair (Top) */}
        <mesh position={[0, 0.26, 0]}>
            <boxGeometry args={[0.52, 0.1, 0.52]} />
            <meshStandardMaterial color={HAIR_COLOR} />
        </mesh>
        {/* Eyes (Simple) */}
        <mesh position={[-0.12, 0, 0.26]}>
            <boxGeometry args={[0.06, 0.06, 0.02]} />
            <meshStandardMaterial color="white" />
        </mesh>
        <mesh position={[0.12, 0, 0.26]}>
            <boxGeometry args={[0.06, 0.06, 0.02]} />
            <meshStandardMaterial color="white" />
        </mesh>
        {/* Pupils */}
        <mesh position={[-0.10, 0, 0.27]}>
            <boxGeometry args={[0.03, 0.03, 0.02]} />
            <meshStandardMaterial color="#4d2c88" /> 
        </mesh>
        <mesh position={[0.14, 0, 0.27]}>
            <boxGeometry args={[0.03, 0.03, 0.02]} />
            <meshStandardMaterial color="#4d2c88" /> 
        </mesh>
      </group>

      {/* Body */}
      <mesh position={[0, 0.125, 0]}>
        <boxGeometry args={[0.5, 0.75, 0.25]} />
        <meshStandardMaterial color={SHIRT_COLOR} />
      </mesh>

      {/* Arms */}
      <mesh ref={leftArm} position={[-0.38, 0.375, 0]}>
        <group position={[0, -0.25, 0]}> {/* Pivot point adjustment */}
            <mesh position={[0, 0, 0]}>
                <boxGeometry args={[0.25, 0.75, 0.25]} />
                <meshStandardMaterial color={SHIRT_COLOR} />
            </mesh>
            {/* Hand */}
            <mesh position={[0, -0.3, 0]}>
                <boxGeometry args={[0.24, 0.25, 0.24]} />
                <meshStandardMaterial color={SKIN_COLOR} />
            </mesh>
        </group>
      </mesh>

      <mesh ref={rightArm} position={[0.38, 0.375, 0]}>
        <group position={[0, -0.25, 0]}>
            <mesh position={[0, 0, 0]}>
                <boxGeometry args={[0.25, 0.75, 0.25]} />
                <meshStandardMaterial color={SHIRT_COLOR} />
            </mesh>
             {/* Hand */}
             <mesh position={[0, -0.3, 0]}>
                <boxGeometry args={[0.24, 0.25, 0.24]} />
                <meshStandardMaterial color={SKIN_COLOR} />
            </mesh>
        </group>
      </mesh>

      {/* Legs */}
      <mesh ref={leftLeg} position={[-0.125, -0.625, 0]}>
        <boxGeometry args={[0.25, 0.75, 0.25]} />
        <meshStandardMaterial color={PANTS_COLOR} />
      </mesh>

      <mesh ref={rightLeg} position={[0.125, -0.625, 0]}>
        <boxGeometry args={[0.25, 0.75, 0.25]} />
        <meshStandardMaterial color={PANTS_COLOR} />
      </mesh>
    </group>
  );
};
