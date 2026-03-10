import { BLOCK_TYPES } from '../game/constants';

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string | number; // Emoji or BlockType
  parent?: string;
  condition: (stats: any) => boolean;
  x: number; // Visual position in tree
  y: number;
}

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: 'root',
    name: 'Bienvenue',
    description: 'Arriver sur GeminiCraft',
    icon: '👋',
    condition: () => true, // Always unlocked at start
    x: 0, y: 0
  },
  // Mining Branch
  {
    id: 'stone_age',
    name: 'Âge de Pierre',
    description: 'Miner votre première pierre',
    icon: BLOCK_TYPES.STONE,
    parent: 'root',
    condition: (stats) => (stats.blocksMined[BLOCK_TYPES.STONE] || 0) >= 1,
    x: 100, y: -100
  },
  {
    id: 'heavy_metal',
    name: 'Métal Lourd',
    description: 'Miner du fer',
    icon: BLOCK_TYPES.ORE_IRON,
    parent: 'stone_age',
    condition: (stats) => (stats.blocksMined[BLOCK_TYPES.ORE_IRON] || 0) >= 1,
    x: 200, y: -100
  },
  {
    id: 'shiny',
    name: 'Tout ce qui brille',
    description: 'Trouver de l\'or',
    icon: BLOCK_TYPES.ORE_GOLD,
    parent: 'heavy_metal',
    condition: (stats) => (stats.blocksMined[BLOCK_TYPES.ORE_GOLD] || 0) >= 1,
    x: 300, y: -100
  },
  {
    id: 'diamond',
    name: 'DIAMANTS !',
    description: 'La richesse absolue',
    icon: BLOCK_TYPES.ORE_DIAMOND,
    parent: 'shiny',
    condition: (stats) => (stats.blocksMined[BLOCK_TYPES.ORE_DIAMOND] || 0) >= 1,
    x: 400, y: -100
  },

  // Wood/Building Branch
  {
    id: 'lumberjack',
    name: 'Bûcheron',
    description: 'Récolter du bois',
    icon: BLOCK_TYPES.WOOD,
    parent: 'root',
    condition: (stats) => (
        (stats.blocksMined[BLOCK_TYPES.WOOD] || 0) + 
        (stats.blocksMined[BLOCK_TYPES.LOG_ACACIA] || 0) +
        (stats.blocksMined[BLOCK_TYPES.LOG_SPRUCE] || 0) +
        (stats.blocksMined[BLOCK_TYPES.LOG_JUNGLE] || 0) +
        (stats.blocksMined[BLOCK_TYPES.LOG_BIRCH] || 0)
    ) >= 1,
    x: 100, y: 0
  },
  {
    id: 'builder',
    name: 'Constructeur',
    description: 'Placer 50 blocs',
    icon: '🏗️',
    parent: 'lumberjack',
    condition: (stats) => Object.values(stats.blocksPlaced as Record<string, number>).reduce((a, b) => a + b, 0) >= 50,
    x: 200, y: 0
  },
  {
    id: 'architect',
    name: 'Architecte',
    description: 'Placer 500 blocs',
    icon: '🏰',
    parent: 'builder',
    condition: (stats) => Object.values(stats.blocksPlaced as Record<string, number>).reduce((a, b) => a + b, 0) >= 500,
    x: 300, y: 0
  },

  // Exploration Branch
  {
    id: 'walker',
    name: 'Promeneur',
    description: 'Marcher 100 mètres',
    icon: '👟',
    parent: 'root',
    condition: (stats) => stats.distanceWalked >= 100,
    x: 100, y: 100
  },
  {
    id: 'explorer',
    name: 'Explorateur',
    description: 'Marcher 1 kilomètre',
    icon: '🗺️',
    parent: 'walker',
    condition: (stats) => stats.distanceWalked >= 1000,
    x: 200, y: 100
  },
  {
    id: 'bunny',
    name: 'Kangourou',
    description: 'Sauter 50 fois',
    icon: '🐇',
    parent: 'walker',
    condition: (stats) => stats.jumps >= 50,
    x: 200, y: 200
  }
];
