export const CHUNK_SIZE = 16;
export const WORLD_HEIGHT = 128; // Increased height for better terrain
export const RENDER_DISTANCE = 3; // chunks

export const BLOCK_TYPES = {
  AIR: 0,
  GRASS: 1,
  DIRT: 2,
  STONE: 3,
  WOOD: 4,
  LEAVES: 5,
  SAND: 6,
  WATER: 7,
  LOG_ACACIA: 8,
  LEAVES_ACACIA: 9,
  LOG_SPRUCE: 10,
  LEAVES_SPRUCE: 11,
  LOG_JUNGLE: 12,
  LEAVES_JUNGLE: 13,
  CACTUS: 14,
  SNOW: 15,
  ICE: 16,
  GRASS_SNOW: 17, // Grass block with snow on top
  // New Decoration Blocks
  FLOWER_RED: 18,
  FLOWER_YELLOW: 19,
  TALL_GRASS: 20,
  DEAD_BUSH: 21,
  MUSHROOM_BROWN: 22,
  MUSHROOM_RED: 23,
  PODZOL: 24,
  RED_SAND: 25,
  // New Blocks Phase 3
  GRAVEL: 26,
  CLAY: 27,
  SANDSTONE: 28,
  COBBLESTONE: 29,
  MOSSY_COBBLESTONE: 30,
  LOG_BIRCH: 31,
  LEAVES_BIRCH: 32,
  SUGAR_CANE: 33,
  BEDROCK: 34,
  ORE_COAL: 35,
  ORE_IRON: 36,
  ORE_GOLD: 37,
  ORE_DIAMOND: 38,
} as const;

export type BlockType = typeof BLOCK_TYPES[keyof typeof BLOCK_TYPES];

export const NON_SOLID_BLOCKS = new Set([
  BLOCK_TYPES.AIR,
  BLOCK_TYPES.WATER,
  BLOCK_TYPES.FLOWER_RED,
  BLOCK_TYPES.FLOWER_YELLOW,
  BLOCK_TYPES.TALL_GRASS,
  BLOCK_TYPES.DEAD_BUSH,
  BLOCK_TYPES.MUSHROOM_BROWN,
  BLOCK_TYPES.MUSHROOM_RED,
  BLOCK_TYPES.SUGAR_CANE
]);

export const isSolid = (block: number) => !NON_SOLID_BLOCKS.has(block);
