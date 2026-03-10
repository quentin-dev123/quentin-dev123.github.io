import React, { useLayoutEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { BLOCK_TYPES, CHUNK_SIZE } from '../game/constants';
import { createTexture, type TextureType } from '../textures/TextureFactory';
import { useWorldStore } from '../store';
import type { ThreeEvent } from '@react-three/fiber';

// Generate materials lazily
let materials: Record<number, THREE.Material | THREE.Material[]> | null = null;

const getMaterials = () => {
  if (materials) return materials;
  try {
    const createMat = (type: TextureType, transparent = false, opacity = 1.0, doubleSide = false) => {
        const tex = createTexture(type);
        const mat = new THREE.MeshStandardMaterial({ 
            map: tex, 
            transparent, 
            opacity,
            alphaTest: transparent ? 0.5 : 0, // Cutout for flora
            side: (transparent || doubleSide) ? THREE.DoubleSide : THREE.FrontSide
        });
        // Important: Flora needs to cast shadows, water doesn't
        mat.shadowSide = THREE.DoubleSide; 
        return mat;
    };

    const mGrassTop = createMat('grass_top');
    const mGrassSide = createMat('grass_side');
    const mDirt = createMat('dirt');
    const mStone = createMat('stone');
    const mWoodSide = createMat('wood_side');
    const mWoodTop = createMat('wood_top');
    const mLeaves = createMat('leaves'); // Oak Leaves
    const mSand = createMat('sand');
    const mRedSand = createMat('red_sand');
    const mPodzolTop = createMat('podzol_top');
    const mPodzolSide = createMat('podzol_side');
    
    // Transparent / Semi-transparent
    const mWater = createMat('water', true, 0.6);
    const mIce = createMat('ice', true, 0.8);
    const mSnow = createMat('snow');
    const mGrassSnowSide = createMat('grass_snow_side');

    // Wood variants
    const mAcaciaLogSide = createMat('log_acacia');
    const mAcaciaLogTop = createMat('log_acacia_top');
    const mAcaciaLeaves = createMat('leaves_acacia');
    
    const mSpruceLogSide = createMat('log_spruce');
    const mSpruceLogTop = createMat('log_spruce_top');
    const mSpruceLeaves = createMat('leaves_spruce');
    
    const mJungleLogSide = createMat('log_jungle');
    const mJungleLogTop = createMat('log_jungle_top');
    const mJungleLeaves = createMat('leaves_jungle');
    
    const mCactusSide = createMat('cactus_side');
    const mCactusTop = createMat('cactus_top');

    // Flora (Cutout)
    const mFlowerRed = createMat('flower_red', true, 1.0, true);
    const mFlowerYellow = createMat('flower_yellow', true, 1.0, true);
    const mTallGrass = createMat('tall_grass', true, 1.0, true);
    const mDeadBush = createMat('dead_bush', true, 1.0, true);
    const mMushroomBrown = createMat('mushroom_brown', true, 1.0, true);
    const mMushroomRed = createMat('mushroom_red', true, 1.0, true);
    const mVines = createMat('vines', true, 1.0, true);
    const mLilypad = createMat('lilypad', true, 1.0, true);

    const mClay = createMat('clay');
    const mGravel = createMat('gravel');
    const mBedrock = createMat('bedrock');
    const mSandstoneSide = createMat('sandstone_side');
    const mSandstoneTop = createMat('sandstone_top');
    const mCobble = createMat('cobblestone');
    const mMossyCobble = createMat('mossy_cobblestone');

    // New Logs & Leaves (Birch)
    const mBirchLogSide = createMat('log_birch');
    const mBirchLogTop = createMat('log_birch_top');
    const mBirchLeaves = createMat('leaves_birch');

    // Ores
    const mOreCoal = createMat('ore_coal');
    const mOreIron = createMat('ore_iron');
    const mOreGold = createMat('ore_gold');
    const mOreDiamond = createMat('ore_diamond');

    const mSugarCane = createMat('sugar_cane', true, 1.0, true);

    const makeLog = (side: THREE.Material, top: THREE.Material) => [side, side, top, top, side, side];
    const makeGrass = (top: THREE.Material, side: THREE.Material, bot: THREE.Material) => [side, side, top, bot, side, side];
    const makeSandstone = (side: THREE.Material, top: THREE.Material) => [side, side, top, top, side, side];
    const makeCactus = (side: THREE.Material, top: THREE.Material) => [side, side, top, side, side, side];
    const makeFlora = (mat: THREE.Material) => mat; // Single material for all faces (easiest for cross/sprite)

    materials = {
      [BLOCK_TYPES.DIRT]: mDirt,
      [BLOCK_TYPES.STONE]: mStone,
      [BLOCK_TYPES.LEAVES]: mLeaves,
      [BLOCK_TYPES.SAND]: mSand,
      [BLOCK_TYPES.RED_SAND]: mRedSand,
      [BLOCK_TYPES.WATER]: mWater,
      [BLOCK_TYPES.SNOW]: mSnow,
      [BLOCK_TYPES.ICE]: mIce,
      [BLOCK_TYPES.CLAY]: mClay,
      [BLOCK_TYPES.GRAVEL]: mGravel,
      [BLOCK_TYPES.BEDROCK]: mBedrock,
      [BLOCK_TYPES.COBBLESTONE]: mCobble,
      [BLOCK_TYPES.MOSSY_COBBLESTONE]: mMossyCobble,

      [BLOCK_TYPES.ORE_COAL]: mOreCoal,
      [BLOCK_TYPES.ORE_IRON]: mOreIron,
      [BLOCK_TYPES.ORE_GOLD]: mOreGold,
      [BLOCK_TYPES.ORE_DIAMOND]: mOreDiamond,
      
      [BLOCK_TYPES.GRASS]: makeGrass(mGrassTop, mGrassSide, mDirt),
      [BLOCK_TYPES.GRASS_SNOW]: makeGrass(mSnow, mGrassSnowSide, mDirt),
      [BLOCK_TYPES.PODZOL]: makeGrass(mPodzolTop, mPodzolSide, mDirt),
      
      [BLOCK_TYPES.SANDSTONE]: makeSandstone(mSandstoneSide, mSandstoneTop),

      [BLOCK_TYPES.WOOD]: makeLog(mWoodSide, mWoodTop),
      [BLOCK_TYPES.LOG_ACACIA]: makeLog(mAcaciaLogSide, mAcaciaLogTop),
      [BLOCK_TYPES.LOG_SPRUCE]: makeLog(mSpruceLogSide, mSpruceLogTop),
      [BLOCK_TYPES.LOG_JUNGLE]: makeLog(mJungleLogSide, mJungleLogTop),
      [BLOCK_TYPES.LOG_BIRCH]: makeLog(mBirchLogSide, mBirchLogTop),
      
      [BLOCK_TYPES.LEAVES_ACACIA]: mAcaciaLeaves,
      [BLOCK_TYPES.LEAVES_SPRUCE]: mSpruceLeaves,
      [BLOCK_TYPES.LEAVES_JUNGLE]: mJungleLeaves,
      [BLOCK_TYPES.LEAVES_BIRCH]: mBirchLeaves,
      
      [BLOCK_TYPES.CACTUS]: makeCactus(mCactusSide, mCactusTop),
      [BLOCK_TYPES.SUGAR_CANE]: mSugarCane,

      // Flora
      [BLOCK_TYPES.FLOWER_RED]: mFlowerRed,
      [BLOCK_TYPES.FLOWER_YELLOW]: mFlowerYellow,
      [BLOCK_TYPES.TALL_GRASS]: mTallGrass,
      [BLOCK_TYPES.DEAD_BUSH]: mDeadBush,
      [BLOCK_TYPES.MUSHROOM_BROWN]: mMushroomBrown,
      [BLOCK_TYPES.MUSHROOM_RED]: mMushroomRed,
      // Vines normally stick to sides, but let's treat as block for simplicity now
      // Actually vines on sides is tricky with InstancedMesh without special rotation
      // Let's just render them as a block for now or skip vines logic if too complex
      // Keeping it simple: Vines block
    };
    return materials;
  } catch (e) {
    console.error("Failed to create materials", e);
    return {};
  }
};

interface ChunkProps {
  chunkX: number;
  chunkZ: number;
  data: { x: number, y: number, z: number, type: number }[];
}

export const Chunk: React.FC<ChunkProps> = React.memo(({ chunkX, chunkZ, data }) => {
  const meshRefs = useRef<Record<number, THREE.InstancedMesh>>({});
  const addBlock = useWorldStore(state => state.addBlock);
  const removeBlock = useWorldStore(state => state.removeBlock);
  
  const materials = useMemo(() => getMaterials(), []);
  
  // Group blocks by type
  const blocksByType = useMemo(() => {
    const groups: Record<number, { x: number, y: number, z: number }[]> = {};
    
    data.forEach(block => {
      if (!groups[block.type]) groups[block.type] = [];
      groups[block.type].push(block);
    });
    
    return groups;
  }, [data]);

  useLayoutEffect(() => {
    Object.entries(blocksByType).forEach(([type, blocks]) => {
      const mesh = meshRefs.current[Number(type)];
      if (!mesh) return;
      
      const tempObject = new THREE.Object3D();
      
      blocks.forEach((block, i) => {
        const worldX = chunkX * CHUNK_SIZE + block.x;
        const worldY = block.y;
        const worldZ = chunkZ * CHUNK_SIZE + block.z;
        
        tempObject.position.set(worldX + 0.5, worldY + 0.5, worldZ + 0.5);
        
        // Custom scaling/rotation for flora?
        // To make it look like a cross, we'd need multiple meshes or a custom geometry.
        // For now, let's just scale them down slightly so they don't look like full blocks
        const t = Number(type);
        if (
            t === BLOCK_TYPES.FLOWER_RED || t === BLOCK_TYPES.FLOWER_YELLOW ||
            t === BLOCK_TYPES.TALL_GRASS || t === BLOCK_TYPES.DEAD_BUSH ||
            t === BLOCK_TYPES.MUSHROOM_BROWN || t === BLOCK_TYPES.MUSHROOM_RED ||
            t === BLOCK_TYPES.SUGAR_CANE
        ) {
            tempObject.scale.set(0.6, 0.6, 0.6);
            tempObject.rotation.y = Math.random() * Math.PI; // Random rotation
        } else {
            tempObject.scale.set(1, 1, 1);
            tempObject.rotation.set(0, 0, 0);
        }

        tempObject.updateMatrix();
        mesh.setMatrixAt(i, tempObject.matrix);
      });
      
      mesh.instanceMatrix.needsUpdate = true;
    });
  }, [blocksByType, chunkX, chunkZ]);

  return (
    <group>
      {Object.entries(blocksByType).map(([type, blocks]) => (
        <instancedMesh
          key={type}
          ref={(el) => { if (el) meshRefs.current[Number(type)] = el; }}
          args={[undefined, undefined, blocks.length]}
          castShadow={Number(type) !== BLOCK_TYPES.WATER} // Disable shadow casting for water
          receiveShadow
          material={materials?.[Number(type)]}
        >
          <boxGeometry args={[1, 1, 1]} />
        </instancedMesh>
      ))}
    </group>
  );
});
