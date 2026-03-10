import React, { useRef, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useInventoryStore } from '../../store/inventory';
import { createTexture } from '../../textures/TextureFactory';
import { getTextureForBlock } from '../../utils/textureMapping';
import * as THREE from 'three';

export const Hand: React.FC = () => {
  const { items, selectedSlot } = useInventoryStore();
  const { camera } = useThree();
  const group = useRef<THREE.Group>(null);
  const mesh = useRef<THREE.Mesh>(null);
  
  const item = items[selectedSlot];
  
  // Bobbing animation state
  const bobbing = useRef(0);

  useFrame((state) => {
    if (!group.current) return;

    // Attach to camera
    // We can't just parent it to camera because camera moves. 
    // Wait, in R3F, if I put <Hand /> inside <Camera /> it works? 
    // No, usually camera is not a container in the scene graph unless explicit.
    // Better to update position every frame.
    
    const time = state.clock.getElapsedTime();
    
    // Simple bobbing if moving (checking camera speed would be better but expensive)
    // We'll just breathe for now
    bobbing.current = Math.sin(time * 2) * 0.05;

    // Position relative to camera
    // Right hand: slightly right, down, forward
    const offset = new THREE.Vector3(0.5, -0.4 + bobbing.current, -0.8);
    offset.applyQuaternion(camera.quaternion);
    
    group.current.position.copy(camera.position).add(offset);
    group.current.quaternion.copy(camera.quaternion);
    
    // Slight sway
    group.current.rotation.z += Math.sin(time) * 0.02;
    group.current.rotation.x += Math.cos(time) * 0.02;
  });

  // Texture handling
  useEffect(() => {
    if (!item || !mesh.current) return;

    const textureType = getTextureForBlock(item.type);
    const texture = createTexture(textureType);
    
    // Update material
    const mat = mesh.current.material as THREE.MeshStandardMaterial;
    if (mat) {
        mat.map = texture;
        mat.needsUpdate = true;
    }

    return () => {
        texture.dispose();
    };
  }, [item?.type]); // Only recreate texture if type changes

  if (!item) return null;

  return (
    <group ref={group}>
      <mesh ref={mesh} position={[0, 0, 0]} rotation={[0, Math.PI / 4, 0]}>
        <boxGeometry args={[0.3, 0.3, 0.3]} />
        <meshStandardMaterial color="white" />
      </mesh>
    </group>
  );
};
