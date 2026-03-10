import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const CLOUD_WIDTH = 20;
const CLOUD_HEIGHT = 5;
const CLOUD_DEPTH = 20;
const WORLD_SIZE = 500; // Half-size of the area to cover (extends -500 to 500)
const CLOUD_Y = 100;

export const Clouds: React.FC = () => {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  
  // Generate cloud positions
  const { particles, count } = useMemo(() => {
    const temp = [];
    // Grid step must match cloud size to avoid gaps/overlaps if we want solid clouds
    const step = 20; 
    
    for (let x = -WORLD_SIZE; x < WORLD_SIZE; x += step) {
      for (let z = -WORLD_SIZE; z < WORLD_SIZE; z += step) {
        // Higher frequency noise for scattered clouds
        const scale = 0.02; // Increased scale for smaller, more frequent features
        const val = Math.sin(x * scale) + Math.sin(z * scale) 
                  + Math.sin(x * scale * 3.7 + 10) * 0.5 
                  + Math.sin(z * scale * 3.7 + 20) * 0.5;
        
        // Higher threshold for sparser clouds
        if (val > 1.2) {
            temp.push({ x, z });
        }
      }
    }
    return { particles: temp, count: temp.length };
  }, []);

  useFrame((state) => {
    if (!meshRef.current) return;
    
    const time = state.clock.getElapsedTime();
    const speed = 5; // Wind speed
    const tempObject = new THREE.Object3D();

    particles.forEach((particle, i) => {
      // Move clouds along X
      let x = particle.x + time * speed;
      
      // Infinite scrolling wrap
      const limit = WORLD_SIZE;
      const width = limit * 2;
      
      // If x exceeds limit, wrap to -limit
      // We use modulo arithmetic for smooth wrapping
      // (x + limit) ensures positive number before modulo
      const wrappedX = ((x + limit) % width) - limit;

      tempObject.position.set(wrappedX, CLOUD_Y, particle.z);
      tempObject.scale.set(CLOUD_WIDTH, CLOUD_HEIGHT, CLOUD_DEPTH);
      tempObject.updateMatrix();
      meshRef.current.setMatrixAt(i, tempObject.matrix);
    });
    
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
      <boxGeometry args={[1, 1, 1]} />
      <meshBasicMaterial 
        color="#ffffff" 
        transparent 
        opacity={0.8} 
        // side={THREE.DoubleSide} // Optional, but FrontSide usually enough for clouds above
      />
    </instancedMesh>
  );
};
