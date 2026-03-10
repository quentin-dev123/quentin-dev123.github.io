import { BLOCK_TYPES } from '../game/constants';
import type { TextureType } from '../textures/TextureFactory';

export const getTextureForBlock = (blockType: number): TextureType => {
  switch (blockType) {
    case BLOCK_TYPES.GRASS: return 'grass_side'; // Use side texture for icon usually, or 'grass_top' if preferred
    case BLOCK_TYPES.DIRT: return 'dirt';
    case BLOCK_TYPES.STONE: return 'stone';
    case BLOCK_TYPES.WOOD: return 'wood_side';
    case BLOCK_TYPES.LEAVES: return 'leaves';
    case BLOCK_TYPES.SAND: return 'sand';
    case BLOCK_TYPES.WATER: return 'water';
    case BLOCK_TYPES.LOG_ACACIA: return 'log_acacia';
    case BLOCK_TYPES.LEAVES_ACACIA: return 'leaves_acacia';
    case BLOCK_TYPES.LOG_SPRUCE: return 'log_spruce';
    case BLOCK_TYPES.LEAVES_SPRUCE: return 'leaves_spruce';
    case BLOCK_TYPES.LOG_JUNGLE: return 'log_jungle';
    case BLOCK_TYPES.LEAVES_JUNGLE: return 'leaves_jungle';
    case BLOCK_TYPES.CACTUS: return 'cactus_side';
    case BLOCK_TYPES.SNOW: return 'snow';
    case BLOCK_TYPES.ICE: return 'ice';
    case BLOCK_TYPES.GRASS_SNOW: return 'grass_snow_side';
    case BLOCK_TYPES.FLOWER_RED: return 'flower_red';
    case BLOCK_TYPES.FLOWER_YELLOW: return 'flower_yellow';
    case BLOCK_TYPES.TALL_GRASS: return 'tall_grass';
    case BLOCK_TYPES.DEAD_BUSH: return 'dead_bush';
    case BLOCK_TYPES.MUSHROOM_BROWN: return 'mushroom_brown';
    case BLOCK_TYPES.MUSHROOM_RED: return 'mushroom_red';
    case BLOCK_TYPES.PODZOL: return 'podzol_side';
    case BLOCK_TYPES.RED_SAND: return 'red_sand';
    case BLOCK_TYPES.GRAVEL: return 'gravel';
    case BLOCK_TYPES.CLAY: return 'clay';
    case BLOCK_TYPES.SANDSTONE: return 'sandstone_side';
    case BLOCK_TYPES.COBBLESTONE: return 'cobblestone';
    case BLOCK_TYPES.MOSSY_COBBLESTONE: return 'mossy_cobblestone';
    case BLOCK_TYPES.LOG_BIRCH: return 'log_birch';
    case BLOCK_TYPES.LEAVES_BIRCH: return 'leaves_birch';
    case BLOCK_TYPES.SUGAR_CANE: return 'sugar_cane';
    case BLOCK_TYPES.BEDROCK: return 'bedrock';
    case BLOCK_TYPES.ORE_COAL: return 'ore_coal';
    case BLOCK_TYPES.ORE_IRON: return 'ore_iron';
    case BLOCK_TYPES.ORE_GOLD: return 'ore_gold';
    case BLOCK_TYPES.ORE_DIAMOND: return 'ore_diamond';
    default: return 'dirt';
  }
};
