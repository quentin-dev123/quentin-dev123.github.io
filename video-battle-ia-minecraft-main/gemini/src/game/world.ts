import { createNoise2D } from 'simplex-noise';
import { BLOCK_TYPES, CHUNK_SIZE, WORLD_HEIGHT } from './constants';

const elevationNoise = createNoise2D();
const temperatureNoise = createNoise2D();
const humidityNoise = createNoise2D();
const riverNoise = createNoise2D();
const oreNoise = createNoise2D();

export const SEA_LEVEL = 20;

export type BiomeType = 'DESERT' | 'SAVANNA' | 'JUNGLE' | 'PLAINS' | 'FOREST' | 'BIRCH_FOREST' | 'TAIGA' | 'TUNDRA' | 'MOUNTAIN' | 'SWAMP' | 'MESA';

interface BiomeData {
  type: BiomeType;
  baseHeight: number;
  roughness: number;
  humidity: number;
  temperature: number;
  surfaceBlock: number;
  subSurfaceBlock: number;
}

const BIOMES: Record<BiomeType, BiomeData> = {
  DESERT: { 
    type: 'DESERT', baseHeight: 22, roughness: 3, 
    humidity: 0.1, temperature: 0.9, 
    surfaceBlock: BLOCK_TYPES.SAND, subSurfaceBlock: BLOCK_TYPES.SAND 
  },
  SAVANNA: { 
    type: 'SAVANNA', baseHeight: 25, roughness: 4, 
    humidity: 0.3, temperature: 0.8, 
    surfaceBlock: BLOCK_TYPES.GRASS, subSurfaceBlock: BLOCK_TYPES.DIRT 
  },
  JUNGLE: { 
    type: 'JUNGLE', baseHeight: 30, roughness: 15, 
    humidity: 0.9, temperature: 0.8, 
    surfaceBlock: BLOCK_TYPES.GRASS, subSurfaceBlock: BLOCK_TYPES.DIRT 
  },
  PLAINS: { 
    type: 'PLAINS', baseHeight: 22, roughness: 3, 
    humidity: 0.4, temperature: 0.5, 
    surfaceBlock: BLOCK_TYPES.GRASS, subSurfaceBlock: BLOCK_TYPES.DIRT 
  },
  FOREST: { 
    type: 'FOREST', baseHeight: 28, roughness: 8, 
    humidity: 0.6, temperature: 0.5, 
    surfaceBlock: BLOCK_TYPES.GRASS, subSurfaceBlock: BLOCK_TYPES.DIRT 
  },
  BIRCH_FOREST: { 
    type: 'BIRCH_FOREST', baseHeight: 28, roughness: 8, 
    humidity: 0.6, temperature: 0.4, 
    surfaceBlock: BLOCK_TYPES.GRASS, subSurfaceBlock: BLOCK_TYPES.DIRT 
  },
  TAIGA: { 
    type: 'TAIGA', baseHeight: 30, roughness: 10, 
    humidity: 0.5, temperature: 0.2, 
    surfaceBlock: BLOCK_TYPES.GRASS, subSurfaceBlock: BLOCK_TYPES.DIRT 
  },
  TUNDRA: { 
    type: 'TUNDRA', baseHeight: 25, roughness: 2, 
    humidity: 0.3, temperature: 0.0, 
    surfaceBlock: BLOCK_TYPES.SNOW, subSurfaceBlock: BLOCK_TYPES.SNOW 
  },
  MOUNTAIN: {
      type: 'MOUNTAIN', baseHeight: 50, roughness: 25,
      humidity: 0.5, temperature: 0.2,
      surfaceBlock: BLOCK_TYPES.STONE, subSurfaceBlock: BLOCK_TYPES.STONE
  },
  SWAMP: {
      type: 'SWAMP', baseHeight: 18, roughness: 2,
      humidity: 0.9, temperature: 0.6,
      surfaceBlock: BLOCK_TYPES.GRASS, subSurfaceBlock: BLOCK_TYPES.DIRT
  },
  MESA: {
      type: 'MESA', baseHeight: 35, roughness: 10,
      humidity: 0.1, temperature: 0.9,
      surfaceBlock: BLOCK_TYPES.RED_SAND, subSurfaceBlock: BLOCK_TYPES.RED_SAND
  }
};

export const getBiome = (x: number, z: number): BiomeData => {
  // Increased frequency (scale factor from 0.005 to 0.015) for smaller biomes
  const scale = 0.015; 
  const t = (temperatureNoise(x * scale, z * scale) + 1) / 2; // 0-1
  const h = (humidityNoise(x * scale, z * scale) + 1) / 2;    // 0-1

  if (t > 0.7) {
    if (h < 0.2) return BIOMES.MESA;
    if (h < 0.4) return BIOMES.DESERT;
    if (h < 0.6) return BIOMES.SAVANNA;
    if (h > 0.8) return BIOMES.SWAMP;
    return BIOMES.JUNGLE;
  } else if (t > 0.3) {
    if (h < 0.4) return BIOMES.PLAINS;
    if (h < 0.6) return BIOMES.FOREST;
    return BIOMES.BIRCH_FOREST;
  } else {
    if (h < 0.3) return BIOMES.MOUNTAIN;
    if (h < 0.5) return BIOMES.TUNDRA;
    return BIOMES.TAIGA;
  }
};

export const getRiverFactor = (x: number, z: number): number => {
  const scale = 0.008; // Wider rivers
  const n = Math.abs(riverNoise(x * scale, z * scale)); 
  return n;
};

export const getHeight = (x: number, z: number): { height: number, biome: BiomeData, isRiver: boolean } => {
  const biome = getBiome(x, z);
  const riverVal = getRiverFactor(x, z);
  let isRiver = riverVal < 0.05; // Slightly wider river threshold

  // Detail noise for terrain
  const scale = 0.02;
  const detail = elevationNoise(x * scale, z * scale);

  let height = biome.baseHeight + detail * biome.roughness;

  // River carving
  if (isRiver) {
     const depth = (0.05 - riverVal) / 0.05; 
     height = height - depth * 10; 
     if (height < SEA_LEVEL - 3) height = SEA_LEVEL - 3; 
  }
  
  // Flatten Swamps
  if (biome.type === 'SWAMP') {
      height = Math.min(height, SEA_LEVEL + 1);
  }

  return { height: Math.floor(height), biome, isRiver };
};

const safePush = (data: { x: number, y: number, z: number, type: number }[], x: number, y: number, z: number, type: number) => {
    if (x >= 0 && x < CHUNK_SIZE && z >= 0 && z < CHUNK_SIZE && y >= 0 && y < WORLD_HEIGHT) {
        data.push({ x, y, z, type });
    }
}

// Tree Generators
const placeStandardTree = (data: any[], x: number, y: number, z: number, log: number, leaves: number, height: number) => {
    for(let i=0; i<height; i++) safePush(data, x, y+i, z, log);
    
    for(let ly=height-2; ly<=height+1; ly++) {
        let radius = ly === height+1 ? 1 : 2;
        for(let lx=x-radius; lx<=x+radius; lx++) {
            for(let lz=z-radius; lz<=z+radius; lz++) {
                if (lx === x && lz === z && ly < height) continue;
                if (Math.abs(lx-x) === radius && Math.abs(lz-z) === radius && Math.random() > 0.5) continue;
                safePush(data, lx, y+ly, lz, leaves);
            }
        }
    }
};

const placeSpruceTree = (data: any[], x: number, y: number, z: number, log: number, leaves: number) => {
    const height = 7;
    for(let i=0; i<height; i++) safePush(data, x, y+i, z, log);
    
    const startY = y + 2;
    const endY = y + height;
    
    for (let ly = startY; ly <= endY; ly++) {
        let radius = Math.floor((endY - ly) / 2) + 1;
        if (ly === endY) radius = 1;
        
        for(let lx=x-radius; lx<=x+radius; lx++) {
            for(let lz=z-radius; lz<=z+radius; lz++) {
                if (lx === x && lz === z && ly < y + height) continue;
                if (Math.abs(lx-x) + Math.abs(lz-z) > radius + 0.5) continue;
                safePush(data, lx, ly, lz, leaves);
            }
        }
    }
};

const placeJungleTree = (data: any[], x: number, y: number, z: number, log: number, leaves: number) => {
    const height = 12;
    for(let i=0; i<height; i++) safePush(data, x, y+i, z, log);
    
    const startY = y + height - 3;
    const endY = y + height;
    
    for (let ly = startY; ly <= endY; ly++) {
        let radius = ly === endY ? 2 : 4;
        for(let lx=x-radius; lx<=x+radius; lx++) {
            for(let lz=z-radius; lz<=z+radius; lz++) {
                if (lx === x && lz === z && ly < y + height) continue;
                if ((lx-x)**2 + (lz-z)**2 <= radius**2 + 1) {
                    safePush(data, lx, ly, lz, leaves);
                }
            }
        }
    }
};

const placeAcaciaTree = (data: any[], x: number, y: number, z: number, log: number, leaves: number) => {
    const height = 6;
    for(let i=0; i<height-2; i++) safePush(data, x, y+i, z, log);
    
    safePush(data, x+1, y+height-2, z, log);
    safePush(data, x+2, y+height-1, z, log);
    safePush(data, x-1, y+height-2, z, log);
    safePush(data, x-2, y+height-1, z, log);
    
    const placeLeafPad = (cx: number, cy: number, cz: number) => {
        for(let lx=cx-2; lx<=cx+2; lx++) {
            for(let lz=cz-2; lz<=cz+2; lz++) {
                if (Math.abs(lx-cx)+Math.abs(lz-cz) <= 3)
                   safePush(data, lx, cy, lz, leaves);
            }
        }
    }
    
    placeLeafPad(x+2, y+height, z);
    placeLeafPad(x-2, y+height, z);
};

const placeCactus = (data: any[], x: number, y: number, z: number) => {
    const height = Math.floor(Math.random() * 3) + 1;
    for(let i=0; i<height; i++) safePush(data, x, y+i, z, BLOCK_TYPES.CACTUS);
}

export const placeVegetation = (
    data: { x: number, y: number, z: number, type: number }[], 
    worldX: number, worldY: number, worldZ: number, 
    biome: BiomeData,
    localX: number, localZ: number
) => {
    // 1. Decoration Pass (Small plants)
    const r = Math.random();
    
    if (biome.type === 'PLAINS') {
        if (r < 0.3) safePush(data, localX, worldY, localZ, BLOCK_TYPES.TALL_GRASS);
        else if (r < 0.35) safePush(data, localX, worldY, localZ, BLOCK_TYPES.FLOWER_YELLOW);
        else if (r < 0.38) safePush(data, localX, worldY, localZ, BLOCK_TYPES.FLOWER_RED);
    } 
    else if (biome.type === 'FOREST' || biome.type === 'BIRCH_FOREST') {
        if (r < 0.1) safePush(data, localX, worldY, localZ, BLOCK_TYPES.TALL_GRASS);
        else if (r < 0.12) safePush(data, localX, worldY, localZ, BLOCK_TYPES.MUSHROOM_BROWN);
        else if (r < 0.13) safePush(data, localX, worldY, localZ, BLOCK_TYPES.MUSHROOM_RED);
    }
    else if (biome.type === 'TAIGA') {
        if (r < 0.1) safePush(data, localX, worldY, localZ, BLOCK_TYPES.TALL_GRASS);
    }
    else if (biome.type === 'DESERT' || biome.type === 'MESA') {
        if (r < 0.05) safePush(data, localX, worldY, localZ, BLOCK_TYPES.DEAD_BUSH);
    }
    else if (biome.type === 'SAVANNA') {
        if (r < 0.4) safePush(data, localX, worldY, localZ, BLOCK_TYPES.TALL_GRASS); 
    }
    else if (biome.type === 'SWAMP') {
        if (r < 0.1) safePush(data, localX, worldY, localZ, BLOCK_TYPES.MUSHROOM_BROWN);
        else if (r < 0.15) safePush(data, localX, worldY, localZ, BLOCK_TYPES.SUGAR_CANE);
    }

    // 2. Trees (Override plants if placed)
    const sin = Math.sin(worldX * 12.9898 + worldZ * 78.233) * 43758.5453;
    const treeR = sin - Math.floor(sin);

    if (biome.type === 'DESERT' || biome.type === 'MESA') {
        if (treeR < 0.01) placeCactus(data, localX, worldY, localZ);
    } else if (biome.type === 'SAVANNA') {
        if (treeR < 0.01) placeAcaciaTree(data, localX, worldY, localZ, BLOCK_TYPES.LOG_ACACIA, BLOCK_TYPES.LEAVES_ACACIA);
    } else if (biome.type === 'JUNGLE') {
        if (treeR < 0.15) placeJungleTree(data, localX, worldY, localZ, BLOCK_TYPES.LOG_JUNGLE, BLOCK_TYPES.LEAVES_JUNGLE);
    } else if (biome.type === 'TAIGA') {
        if (treeR < 0.04) placeSpruceTree(data, localX, worldY, localZ, BLOCK_TYPES.LOG_SPRUCE, BLOCK_TYPES.LEAVES_SPRUCE);
    } else if (biome.type === 'FOREST' || biome.type === 'SWAMP') {
        if (treeR < 0.05) placeStandardTree(data, localX, worldY, localZ, BLOCK_TYPES.WOOD, BLOCK_TYPES.LEAVES, 5);
    } else if (biome.type === 'BIRCH_FOREST') {
        if (treeR < 0.05) placeStandardTree(data, localX, worldY, localZ, BLOCK_TYPES.LOG_BIRCH, BLOCK_TYPES.LEAVES_BIRCH, 5);
    }
};

const getOre = (y: number, worldX: number, worldZ: number) => {
    // Simple ore distribution
    const n = Math.abs(oreNoise(worldX * 0.1, worldZ * 0.1 + y * 0.1));
    
    if (n > 0.6) {
        if (y < 12 && n > 0.85) return BLOCK_TYPES.ORE_DIAMOND;
        if (y < 32 && n > 0.8) return BLOCK_TYPES.ORE_GOLD;
        if (y < 48 && n > 0.75) return BLOCK_TYPES.ORE_IRON;
        if (y < 60) return BLOCK_TYPES.ORE_COAL;
    }
    return null;
}

export const generateChunk = (chunkX: number, chunkZ: number) => {
  const data: { x: number, y: number, z: number, type: number }[] = [];
  
  const heights = new Int32Array(CHUNK_SIZE * CHUNK_SIZE); 
  const biomes = new Array(CHUNK_SIZE * CHUNK_SIZE);

  // 1. Generate Terrain
  for (let x = 0; x < CHUNK_SIZE; x++) {
    for (let z = 0; z < CHUNK_SIZE; z++) {
      const worldX = chunkX * CHUNK_SIZE + x;
      const worldZ = chunkZ * CHUNK_SIZE + z;
      
      const { height, biome, isRiver } = getHeight(worldX, worldZ);
      
      heights[x * CHUNK_SIZE + z] = height;
      biomes[x * CHUNK_SIZE + z] = biome;

      // Fill Column
      for (let y = 0; y < WORLD_HEIGHT; y++) {
        let type = BLOCK_TYPES.AIR;

        if (y === 0) {
            type = BLOCK_TYPES.BEDROCK;
        } else if (y <= height) {
           if (y === height) {
               type = biome.surfaceBlock;
               
               // Biome Specific Ground Overrides
               if (biome.type === 'TAIGA' || biome.type === 'FOREST' || biome.type === 'BIRCH_FOREST') {
                   const p = Math.sin(worldX * 0.1) * Math.cos(worldZ * 0.1);
                   if (p > 0.6) type = BLOCK_TYPES.PODZOL;
               }
               if (biome.type === 'DESERT' || biome.type === 'SAVANNA' || biome.type === 'MESA') {
                   const p = Math.sin(worldX * 0.05 + worldZ * 0.05);
                   if (p > 0.8) type = BLOCK_TYPES.RED_SAND;
               }
               
               // River beaches
               if (isRiver && y >= SEA_LEVEL - 1 && y <= SEA_LEVEL + 1) {
                    type = BLOCK_TYPES.GRAVEL;
                    if (biome.type === 'DESERT') type = BLOCK_TYPES.SAND;
               }

               if (type === BLOCK_TYPES.GRASS && y < SEA_LEVEL - 1) type = BLOCK_TYPES.DIRT;
           } else if (y > height - 4) {
               type = biome.subSurfaceBlock;
               if (biome.type === 'MESA' && y > height - 10) {
                   // Terracotta bands (simulated with sandstone/red sand for now)
                   if (y % 4 === 0) type = BLOCK_TYPES.RED_SAND;
                   else type = BLOCK_TYPES.SANDSTONE; // Placeholder for hardened clay
               }
           } else {
               type = BLOCK_TYPES.STONE;
               // Ore generation
               const ore = getOre(y, worldX, worldZ);
               if (ore) type = ore;
           }
        } else if (y <= SEA_LEVEL) {
           type = BLOCK_TYPES.WATER;
           if (y === SEA_LEVEL && (biome.type === 'TAIGA' || biome.type === 'TUNDRA' || biome.type === 'MOUNTAIN')) {
               type = BLOCK_TYPES.ICE; 
           }
        }

        if (type !== BLOCK_TYPES.AIR) {
          data.push({ x, y, z, type });
        }
      }
    }
  }

  // 2. Generate Vegetation
  const padding = 4;
  
  const seededRandom = (x: number, z: number) => {
      const sin = Math.sin(x * 12.9898 + z * 78.233) * 43758.5453;
      return sin - Math.floor(sin);
  };

  for (let x = -padding; x < CHUNK_SIZE + padding; x++) {
    for (let z = -padding; z < CHUNK_SIZE + padding; z++) {
      const worldX = chunkX * CHUNK_SIZE + x;
      const worldZ = chunkZ * CHUNK_SIZE + z;
      
      let height, biome, isRiver;

      if (x >= 0 && x < CHUNK_SIZE && z >= 0 && z < CHUNK_SIZE) {
          height = heights[x * CHUNK_SIZE + z];
          biome = biomes[x * CHUNK_SIZE + z];
          isRiver = getRiverFactor(worldX, worldZ) < 0.05;
      } else {
          const res = getHeight(worldX, worldZ);
          height = res.height;
          biome = res.biome;
          isRiver = res.isRiver;
      }
      
      if (isRiver) continue;
      if (height <= SEA_LEVEL && biome.type !== 'DESERT' && biome.type !== 'SWAMP') continue;

      const insideChunk = (x >= 0 && x < CHUNK_SIZE && z >= 0 && z < CHUNK_SIZE);
      
      if (insideChunk) {
          placeVegetation(data, worldX, height + 1, worldZ, biome, x, z);
      } else {
          placeVegetation(data, worldX, height + 1, worldZ, biome, x, z);
      }
    }
  }

  return data;
};
