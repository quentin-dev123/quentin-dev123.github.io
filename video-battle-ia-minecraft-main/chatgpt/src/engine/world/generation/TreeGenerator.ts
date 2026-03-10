import { BlockId } from '../BlockTypes';
import { CHUNK_SIZE_X, CHUNK_SIZE_Y, CHUNK_SIZE_Z } from '../constants';
import { type BiomeDefinition } from './Biome';
import { NoiseSampler } from './NoiseSampler';

type ChunkLike = {
  get: (x: number, y: number, z: number) => BlockId;
  set: (x: number, y: number, z: number, block: BlockId) => void;
  inBounds: (x: number, y: number, z: number) => boolean;
};

type TreeVariant = 'oakSmall' | 'oakLarge' | 'pine';

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export class TreeGenerator {
  tryPlaceTree(
    chunk: ChunkLike,
    noise: NoiseSampler,
    worldX: number,
    worldZ: number,
    localX: number,
    groundY: number,
    localZ: number,
    biome: BiomeDefinition,
  ): void {
    if (localX < 1 || localX > CHUNK_SIZE_X - 2 || localZ < 1 || localZ > CHUNK_SIZE_Z - 2) {
      return;
    }
    if (groundY < 4 || groundY > CHUNK_SIZE_Y - 18) {
      return;
    }

    const treeChance = noise.hash2D(worldX, worldZ, 91.1);
    if (treeChance > biome.treeDensity) {
      return;
    }

    const spacingSignal = noise.hash2D(Math.floor(worldX / 5), Math.floor(worldZ / 5), 16.3);
    if (spacingSignal < 0.22) {
      return;
    }

    const variant = this.selectVariant(noise, worldX, worldZ, biome);
    if (!this.canPlaceTrunk(chunk, localX, groundY + 1, localZ, variant)) {
      return;
    }

    if (variant === 'oakSmall') {
      this.placeOakSmall(chunk, localX, groundY + 1, localZ);
    } else if (variant === 'oakLarge') {
      this.placeOakLarge(chunk, localX, groundY + 1, localZ);
    } else {
      this.placePine(chunk, localX, groundY + 1, localZ);
    }
  }

  private selectVariant(noise: NoiseSampler, worldX: number, worldZ: number, biome: BiomeDefinition): TreeVariant {
    const sample = noise.hash2D(worldX, worldZ, 208.9);
    if (biome.id === 'taigaLike' || biome.id === 'mountains') {
      return sample < 0.75 ? 'pine' : 'oakSmall';
    }
    if (sample < 0.45) {
      return 'oakSmall';
    }
    return sample < 0.9 ? 'oakLarge' : 'pine';
  }

  private canPlaceTrunk(chunk: ChunkLike, x: number, y: number, z: number, variant: TreeVariant): boolean {
    const height = variant === 'oakLarge' ? 7 : variant === 'pine' ? 8 : 5;
    for (let i = 0; i < height; i += 1) {
      const yy = y + i;
      if (yy >= CHUNK_SIZE_Y || !chunk.inBounds(x, yy, z)) {
        return false;
      }
      if (chunk.get(x, yy, z) !== BlockId.Air && chunk.get(x, yy, z) !== BlockId.TallGrass) {
        return false;
      }
    }
    return true;
  }

  private placeOakSmall(chunk: ChunkLike, x: number, y: number, z: number): void {
    const trunkHeight = 4 + ((x * 11 + z * 7) % 2);
    for (let i = 0; i < trunkHeight; i += 1) {
      chunk.set(x, y + i, z, BlockId.Wood);
    }
    this.placeCanopyBlob(chunk, x, y + trunkHeight, z, 2);
  }

  private placeOakLarge(chunk: ChunkLike, x: number, y: number, z: number): void {
    const trunkHeight = 6 + ((x * 13 + z * 9) % 2);
    for (let i = 0; i < trunkHeight; i += 1) {
      chunk.set(x, y + i, z, BlockId.Wood);
    }
    this.placeCanopyBlob(chunk, x, y + trunkHeight, z, 3);
    this.placeCanopyBlob(chunk, x, y + trunkHeight + 1, z, 2);
  }

  private placePine(chunk: ChunkLike, x: number, y: number, z: number): void {
    const trunkHeight = 7 + ((x * 5 + z * 17) % 2);
    for (let i = 0; i < trunkHeight; i += 1) {
      chunk.set(x, y + i, z, BlockId.Wood);
    }

    const crownBase = y + trunkHeight - 4;
    for (let layer = 0; layer < 5; layer += 1) {
      const radius = clamp(3 - Math.floor(layer / 2), 1, 3);
      this.placeCanopyDisk(chunk, x, crownBase + layer, z, radius);
    }
    if (chunk.inBounds(x, y + trunkHeight, z)) {
      chunk.set(x, y + trunkHeight, z, BlockId.Leaves);
    }
  }

  private placeCanopyBlob(chunk: ChunkLike, centerX: number, centerY: number, centerZ: number, radius: number): void {
    for (let dy = -radius; dy <= radius; dy += 1) {
      for (let dz = -radius; dz <= radius; dz += 1) {
        for (let dx = -radius; dx <= radius; dx += 1) {
          const dist = Math.abs(dx) + Math.abs(dy) + Math.abs(dz);
          if (dist > radius + 1) {
            continue;
          }
          const x = centerX + dx;
          const y = centerY + dy;
          const z = centerZ + dz;
          if (!chunk.inBounds(x, y, z)) {
            continue;
          }
          if (chunk.get(x, y, z) === BlockId.Air || chunk.get(x, y, z) === BlockId.TallGrass) {
            chunk.set(x, y, z, BlockId.Leaves);
          }
        }
      }
    }
  }

  private placeCanopyDisk(chunk: ChunkLike, centerX: number, y: number, centerZ: number, radius: number): void {
    for (let dz = -radius; dz <= radius; dz += 1) {
      for (let dx = -radius; dx <= radius; dx += 1) {
        if (Math.abs(dx) + Math.abs(dz) > radius + 1) {
          continue;
        }
        const x = centerX + dx;
        const z = centerZ + dz;
        if (!chunk.inBounds(x, y, z)) {
          continue;
        }
        if (chunk.get(x, y, z) === BlockId.Air || chunk.get(x, y, z) === BlockId.TallGrass) {
          chunk.set(x, y, z, BlockId.Leaves);
        }
      }
    }
  }
}
