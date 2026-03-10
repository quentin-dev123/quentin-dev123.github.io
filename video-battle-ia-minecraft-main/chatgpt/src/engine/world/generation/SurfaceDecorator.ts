import { BlockId } from '../BlockTypes';
import { CHUNK_SIZE_Y, SEA_LEVEL } from '../constants';
import { type BiomeProfile } from './Biome';
import { NoiseSampler } from './NoiseSampler';
import { TreeGenerator } from './TreeGenerator';

type ChunkLike = {
  get: (x: number, y: number, z: number) => BlockId;
  set: (x: number, y: number, z: number, block: BlockId) => void;
  inBounds: (x: number, y: number, z: number) => boolean;
};

export class SurfaceDecorator {
  private readonly trees = new TreeGenerator();

  decorateColumn(
    chunk: ChunkLike,
    noise: NoiseSampler,
    worldX: number,
    worldZ: number,
    localX: number,
    surfaceY: number,
    localZ: number,
    biome: BiomeProfile,
    riverBlend: number,
  ): void {
    if (surfaceY <= 1 || surfaceY >= CHUNK_SIZE_Y - 2) {
      return;
    }
    const ground = chunk.get(localX, surfaceY, localZ);
    const above = chunk.get(localX, surfaceY + 1, localZ);
    if (
      above !== BlockId.Air ||
      (ground !== BlockId.Grass &&
        ground !== BlockId.Sand &&
        ground !== BlockId.Snow &&
        ground !== BlockId.Podzol &&
        ground !== BlockId.Mud)
    ) {
      return;
    }

    // Sol enneige automatiquement les hauteurs froides.
    if (surfaceY > SEA_LEVEL + 21 + biome.snowLineOffset && ground !== BlockId.Sand) {
      chunk.set(localX, surfaceY, localZ, BlockId.Snow);
    }

    this.trees.tryPlaceTree(chunk, noise, worldX, worldZ, localX, surfaceY, localZ, biome.primary);

    if ((ground !== BlockId.Grass && ground !== BlockId.Podzol && ground !== BlockId.Mud) || biome.treeDensity > 0.12) {
      return;
    }

    const floraMask = noise.hash2D(worldX, worldZ, 410.5);
    const riverDamp = 1 - riverBlend * 0.4;
    const grassChance = biome.grassDensity * riverDamp;
    const flowerChance = biome.flowerDensity * riverDamp;
    if (floraMask < flowerChance) {
      const flower = noise.hash2D(worldX, worldZ, 411.7) > 0.5 ? BlockId.FlowerRed : BlockId.FlowerYellow;
      chunk.set(localX, surfaceY + 1, localZ, flower);
      return;
    }
    if (floraMask > 0.985) {
      chunk.set(localX, surfaceY + 1, localZ, BlockId.Glowshroom);
      return;
    }
    if (floraMask > 0.962 && floraMask < 0.97 && ground === BlockId.Grass) {
      chunk.set(localX, surfaceY + 1, localZ, BlockId.PackedBrick);
      return;
    }
    if (floraMask < flowerChance + grassChance) {
      chunk.set(localX, surfaceY + 1, localZ, BlockId.TallGrass);
    }
  }
}
