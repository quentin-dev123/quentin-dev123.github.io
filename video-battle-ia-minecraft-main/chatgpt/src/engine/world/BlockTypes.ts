export const BlockId = {
  Air: 0,
  Grass: 1,
  Dirt: 2,
  Stone: 3,
  Wood: 4,
  Leaves: 5,
  Sand: 6,
  Gravel: 7,
  Water: 8,
  Snow: 9,
  TallGrass: 10,
  FlowerRed: 11,
  FlowerYellow: 12,
  WaterFlow1: 13,
  WaterFlow2: 14,
  WaterFlow3: 15,
  WaterFlow4: 16,
  WaterFlow5: 17,
  WaterFlow6: 18,
  WaterFlow7: 19,
  Mud: 20,
  Clay: 21,
  Podzol: 22,
  Glowshroom: 23,
  CandyBlock: 24,
  PackedBrick: 25,
} as const;

export type BlockId = (typeof BlockId)[keyof typeof BlockId];

export type BlockRenderType = 'cube' | 'cross';

type BlockDefinition = {
  solid: boolean;
  opaque: boolean;
  renderType: BlockRenderType;
  breakable: boolean;
  hardnessSeconds: number;
};

const DEFAULT_BLOCK_DEFINITION: BlockDefinition = {
  solid: true,
  opaque: true,
  renderType: 'cube',
  breakable: true,
  hardnessSeconds: 0.8,
};

const BLOCK_DEFINITIONS: Record<number, BlockDefinition> = {
  [BlockId.Air]: { solid: false, opaque: false, renderType: 'cube', breakable: false, hardnessSeconds: 0 },
  [BlockId.Grass]: DEFAULT_BLOCK_DEFINITION,
  [BlockId.Dirt]: { ...DEFAULT_BLOCK_DEFINITION, hardnessSeconds: 0.68 },
  [BlockId.Stone]: { ...DEFAULT_BLOCK_DEFINITION, hardnessSeconds: 1.8 },
  [BlockId.Wood]: { ...DEFAULT_BLOCK_DEFINITION, hardnessSeconds: 1.35 },
  [BlockId.Leaves]: { solid: true, opaque: false, renderType: 'cube', breakable: true, hardnessSeconds: 0.24 },
  [BlockId.Sand]: { ...DEFAULT_BLOCK_DEFINITION, hardnessSeconds: 0.62 },
  [BlockId.Gravel]: { ...DEFAULT_BLOCK_DEFINITION, hardnessSeconds: 0.72 },
  [BlockId.Water]: { solid: false, opaque: false, renderType: 'cube', breakable: false, hardnessSeconds: 0 },
  [BlockId.Snow]: { ...DEFAULT_BLOCK_DEFINITION, hardnessSeconds: 0.34 },
  [BlockId.TallGrass]: { solid: false, opaque: false, renderType: 'cross', breakable: true, hardnessSeconds: 0.08 },
  [BlockId.FlowerRed]: { solid: false, opaque: false, renderType: 'cross', breakable: true, hardnessSeconds: 0.08 },
  [BlockId.FlowerYellow]: {
    solid: false,
    opaque: false,
    renderType: 'cross',
    breakable: true,
    hardnessSeconds: 0.08,
  },
  [BlockId.WaterFlow1]: { solid: false, opaque: false, renderType: 'cube', breakable: false, hardnessSeconds: 0 },
  [BlockId.WaterFlow2]: { solid: false, opaque: false, renderType: 'cube', breakable: false, hardnessSeconds: 0 },
  [BlockId.WaterFlow3]: { solid: false, opaque: false, renderType: 'cube', breakable: false, hardnessSeconds: 0 },
  [BlockId.WaterFlow4]: { solid: false, opaque: false, renderType: 'cube', breakable: false, hardnessSeconds: 0 },
  [BlockId.WaterFlow5]: { solid: false, opaque: false, renderType: 'cube', breakable: false, hardnessSeconds: 0 },
  [BlockId.WaterFlow6]: { solid: false, opaque: false, renderType: 'cube', breakable: false, hardnessSeconds: 0 },
  [BlockId.WaterFlow7]: { solid: false, opaque: false, renderType: 'cube', breakable: false, hardnessSeconds: 0 },
  [BlockId.Mud]: { ...DEFAULT_BLOCK_DEFINITION, hardnessSeconds: 0.96 },
  [BlockId.Clay]: { ...DEFAULT_BLOCK_DEFINITION, hardnessSeconds: 1.1 },
  [BlockId.Podzol]: { ...DEFAULT_BLOCK_DEFINITION, hardnessSeconds: 0.86 },
  [BlockId.Glowshroom]: { solid: false, opaque: false, renderType: 'cross', breakable: true, hardnessSeconds: 0.12 },
  [BlockId.CandyBlock]: { ...DEFAULT_BLOCK_DEFINITION, hardnessSeconds: 0.55 },
  [BlockId.PackedBrick]: { ...DEFAULT_BLOCK_DEFINITION, hardnessSeconds: 1.4 },
};

export function getBlockDefinition(block: BlockId): BlockDefinition {
  return BLOCK_DEFINITIONS[block] ?? DEFAULT_BLOCK_DEFINITION;
}

export function isSolidBlock(block: BlockId): boolean {
  return getBlockDefinition(block).solid;
}

export function isOpaqueBlock(block: BlockId): boolean {
  return getBlockDefinition(block).opaque;
}

export function getBlockRenderType(block: BlockId): BlockRenderType {
  return getBlockDefinition(block).renderType;
}

export function isBreakableBlock(block: BlockId): boolean {
  return getBlockDefinition(block).breakable;
}

export function getBlockHardnessSeconds(block: BlockId): number {
  return getBlockDefinition(block).hardnessSeconds;
}

export function isWaterBlock(block: BlockId): boolean {
  return (
    block === BlockId.Water ||
    block === BlockId.WaterFlow1 ||
    block === BlockId.WaterFlow2 ||
    block === BlockId.WaterFlow3 ||
    block === BlockId.WaterFlow4 ||
    block === BlockId.WaterFlow5 ||
    block === BlockId.WaterFlow6 ||
    block === BlockId.WaterFlow7
  );
}

export function getWaterLevel(block: BlockId): number {
  switch (block) {
    case BlockId.Water:
      return 0;
    case BlockId.WaterFlow1:
      return 1;
    case BlockId.WaterFlow2:
      return 2;
    case BlockId.WaterFlow3:
      return 3;
    case BlockId.WaterFlow4:
      return 4;
    case BlockId.WaterFlow5:
      return 5;
    case BlockId.WaterFlow6:
      return 6;
    case BlockId.WaterFlow7:
      return 7;
    default:
      return Number.POSITIVE_INFINITY;
  }
}

export function getFlowBlockForLevel(level: number): BlockId {
  if (level <= 0) return BlockId.Water;
  if (level === 1) return BlockId.WaterFlow1;
  if (level === 2) return BlockId.WaterFlow2;
  if (level === 3) return BlockId.WaterFlow3;
  if (level === 4) return BlockId.WaterFlow4;
  if (level === 5) return BlockId.WaterFlow5;
  if (level === 6) return BlockId.WaterFlow6;
  return BlockId.WaterFlow7;
}
