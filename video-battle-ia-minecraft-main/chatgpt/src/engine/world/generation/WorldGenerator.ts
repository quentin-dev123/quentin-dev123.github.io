import { BlockId, isWaterBlock } from '../BlockTypes';
import { Chunk } from '../Chunk';
import { CHUNK_SIZE_X, CHUNK_SIZE_Y, CHUNK_SIZE_Z, SEA_LEVEL, WORLD_SEED } from '../constants';
import { type BiomeProfile, type ClimateSample, sampleBiomeProfile } from './Biome';
import { CaveGenerator } from './CaveGenerator';
import { HeightModel } from './HeightModel';
import { NoiseSampler } from './NoiseSampler';
import { RiverGenerator, type RiverInfo } from './RiverGenerator';
import { SurfaceDecorator } from './SurfaceDecorator';

type WorldGeneratorOptions = {
  seed?: string;
};

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export class WorldGenerator {
  private readonly noise: NoiseSampler;
  private readonly riverGenerator = new RiverGenerator();
  private readonly caveGenerator = new CaveGenerator();
  private readonly heightModel = new HeightModel();
  private readonly surfaceDecorator = new SurfaceDecorator();

  constructor(options: WorldGeneratorOptions = {}) {
    this.noise = new NoiseSampler(options.seed ?? WORLD_SEED);
  }

  generateChunk(chunk: Chunk): void {
    const surfaceHeights = new Int16Array(CHUNK_SIZE_X * CHUNK_SIZE_Z);
    const localMountainWeight = new Float32Array(CHUNK_SIZE_X * CHUNK_SIZE_Z);
    const localRiverBlend = new Float32Array(CHUNK_SIZE_X * CHUNK_SIZE_Z);
    const localBiomeProfile: BiomeProfile[] = new Array(CHUNK_SIZE_X * CHUNK_SIZE_Z);

    for (let z = 0; z < CHUNK_SIZE_Z; z += 1) {
      for (let x = 0; x < CHUNK_SIZE_X; x += 1) {
        const index = x + z * CHUNK_SIZE_X;
        const wx = chunk.cx * CHUNK_SIZE_X + x;
        const wz = chunk.cz * CHUNK_SIZE_Z + z;

        const climate = this.sampleClimate(wx, wz);
        const riverInfo = this.riverGenerator.getRiverInfo(this.noise, wx, wz);
        const biomeProfile = sampleBiomeProfile(climate, riverInfo.isRiver);
        localBiomeProfile[index] = biomeProfile;
        const surfaceY = this.heightModel.computeSurfaceHeight(this.noise, wx, wz, biomeProfile, riverInfo);
        surfaceHeights[index] = surfaceY;

        localMountainWeight[index] = biomeProfile.mountainFactor;
        localRiverBlend[index] = riverInfo.blend;

        const surfaceBlocks = this.resolveSurfaceBlocks(surfaceY, climate, biomeProfile, riverInfo, wx, wz);
        const topBlock = surfaceBlocks.top;
        const fillerBlock = surfaceBlocks.filler;
        const deepBlock = surfaceBlocks.deep;
        const depth = 3 + Math.floor(this.noise.hash2D(wx, wz, 91.2) * 3);
        const transition = 2 + Math.floor(this.noise.hash2D(wx, wz, 71.8) * 2);

        for (let y = 0; y <= surfaceY; y += 1) {
          let block: BlockId = deepBlock;
          if (y === surfaceY) block = topBlock;
          else if (surfaceY - y <= depth) block = fillerBlock;
          else if (surfaceY - y <= depth + transition) block = this.blendSubsurface(fillerBlock, deepBlock, wx, y, wz);
          chunk.set(x, y, z, block);
        }

        const riverBankBlend = riverInfo.isRiver ? riverInfo.blend : 0;
        if (riverBankBlend > 0.24 && surfaceY >= SEA_LEVEL - 4 && surfaceY <= SEA_LEVEL + 3) {
          chunk.set(x, surfaceY, z, this.noise.hash2D(wx, wz, 99.2) > 0.5 ? BlockId.Sand : BlockId.Gravel);
        }

        for (let y = surfaceY + 1; y <= clamp(riverInfo.waterLevel, 0, CHUNK_SIZE_Y - 1); y += 1) {
          chunk.set(x, y, z, BlockId.Water);
        }
      }
    }

    for (let z = 0; z < CHUNK_SIZE_Z; z += 1) {
      for (let x = 0; x < CHUNK_SIZE_X; x += 1) {
        const index = x + z * CHUNK_SIZE_X;
        const surfaceY = surfaceHeights[index];
        const wx = chunk.cx * CHUNK_SIZE_X + x;
        const wz = chunk.cz * CHUNK_SIZE_Z + z;
        const mountainFactor = localMountainWeight[index];

        this.caveGenerator.carvePass(this.noise, wx, wz, surfaceY, mountainFactor, (y, block) => {
          chunk.set(x, y, z, block);
        });
      }
    }

    for (let z = 0; z < CHUNK_SIZE_Z; z += 1) {
      for (let x = 0; x < CHUNK_SIZE_X; x += 1) {
        const index = x + z * CHUNK_SIZE_X;
        const wx = chunk.cx * CHUNK_SIZE_X + x;
        const wz = chunk.cz * CHUNK_SIZE_Z + z;
        const surfaceY = this.resolveSurfaceY(chunk, x, z, surfaceHeights[index]);
        const biomeProfile = localBiomeProfile[index];
        this.surfaceDecorator.decorateColumn(
          chunk,
          this.noise,
          wx,
          wz,
          x,
          surfaceY,
          z,
          biomeProfile,
          localRiverBlend[index],
        );
      }
    }

    chunk.dirty = true;
  }

  private sampleClimate(wx: number, wz: number): ClimateSample {
    const warped = this.noise.warp2D(wx, wz, 0.0032, 18);
    const continentalness = this.noise.fbm2D(warped.wx + 1300, warped.wz - 910, 0.0025, 4, 2, 0.5);
    const erosion = this.noise.fbm2D(warped.wx - 820, warped.wz + 610, 0.0048, 3, 2, 0.5);
    const temperature = (this.noise.fbm2D(warped.wx + 230, warped.wz - 440, 0.0031, 4, 2, 0.52) + 1) * 0.5;
    const moisture = (this.noise.fbm2D(warped.wx - 340, warped.wz + 780, 0.0034, 4, 2, 0.52) + 1) * 0.5;
    const weirdness = this.noise.fbm2D(warped.wx + 1700, warped.wz + 1200, 0.0052, 2, 2, 0.5);
    return {
      continentalness,
      erosion,
      temperature,
      moisture,
      weirdness,
    };
  }

  private resolveSurfaceY(chunk: Chunk, x: number, z: number, startY: number): number {
    for (let y = Math.min(startY + 4, CHUNK_SIZE_Y - 1); y >= 0; y -= 1) {
      const block = chunk.get(x, y, z);
      if (block !== BlockId.Air && !isWaterBlock(block)) {
        return y;
      }
    }
    return 0;
  }

  private resolveSurfaceBlocks(
    surfaceY: number,
    climate: ClimateSample,
    biome: BiomeProfile,
    riverInfo: RiverInfo,
    wx: number,
    wz: number,
  ): { top: BlockId; filler: BlockId; deep: BlockId } {
    const nearRiver = riverInfo.isRiver && riverInfo.blend > 0.2;
    if (nearRiver && surfaceY <= SEA_LEVEL + 3) {
      return {
        top: this.noise.hash2D(wx, wz, 22.6) > 0.45 ? BlockId.Sand : BlockId.Gravel,
        filler: BlockId.Gravel,
        deep: BlockId.Stone,
      };
    }

    if (surfaceY >= SEA_LEVEL + 32 + biome.snowLineOffset) {
      return { top: BlockId.Snow, filler: BlockId.Stone, deep: BlockId.Stone };
    }

    const veryDry = climate.temperature > 0.7 && climate.moisture < 0.32;
    if (veryDry) {
      return { top: BlockId.Sand, filler: BlockId.Sand, deep: BlockId.Stone };
    }

    const veryWet = climate.moisture > 0.72 && climate.temperature > 0.38;
    if (veryWet) {
      const top = this.noise.hash2D(wx, wz, 41.4) > 0.44 ? BlockId.Mud : BlockId.Grass;
      const filler = this.noise.hash2D(wx, wz, 42.2) > 0.5 ? BlockId.Clay : BlockId.Dirt;
      return { top, filler, deep: BlockId.Stone };
    }

    if (biome.primary.id === 'taigaLike' || (climate.temperature < 0.38 && climate.moisture > 0.48)) {
      return { top: BlockId.Podzol, filler: BlockId.Dirt, deep: BlockId.Stone };
    }

    if (biome.mountainFactor > 0.66 && surfaceY > SEA_LEVEL + 18) {
      const rocky = this.noise.hash2D(wx, wz, 61.5) > 0.67;
      return { top: rocky ? BlockId.Stone : BlockId.Grass, filler: BlockId.Dirt, deep: BlockId.Stone };
    }

    return { top: BlockId.Grass, filler: BlockId.Dirt, deep: BlockId.Stone };
  }

  private blendSubsurface(filler: BlockId, deep: BlockId, wx: number, y: number, wz: number): BlockId {
    const n = this.noise.hash2D(wx + y * 3, wz - y * 2, 19.9);
    if (n > 0.64) {
      return deep;
    }
    return filler;
  }
}
