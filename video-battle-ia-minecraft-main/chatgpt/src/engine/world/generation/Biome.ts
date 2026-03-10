import { BlockId } from '../BlockTypes';

export type BiomeId =
  | 'ocean'
  | 'river'
  | 'plains'
  | 'forest'
  | 'flowerField'
  | 'taigaLike'
  | 'desertLike'
  | 'hills'
  | 'mountains'
  | 'rockyPeaks';

export type ClimateSample = {
  continentalness: number;
  erosion: number;
  temperature: number;
  moisture: number;
  weirdness: number;
};

export type BiomeDefinition = {
  id: BiomeId;
  topBlock: BlockId;
  fillerBlock: BlockId;
  elevationOffset: number;
  reliefStrength: number;
  ridgeStrength: number;
  treeDensity: number;
  grassDensity: number;
  flowerDensity: number;
  snowLineOffset: number;
  roughness: number;
};

export type BiomeBlend = {
  primary: BiomeDefinition;
  secondary: BiomeDefinition;
  blend: number;
};

export type BiomeProfile = {
  primary: BiomeDefinition;
  secondary: BiomeDefinition;
  blend: number;
  elevationOffset: number;
  reliefStrength: number;
  ridgeStrength: number;
  treeDensity: number;
  grassDensity: number;
  flowerDensity: number;
  snowLineOffset: number;
  roughness: number;
  mountainFactor: number;
};

type BiomeTarget = BiomeDefinition & {
  target: {
    continentalness: number;
    erosion: number;
    temperature: number;
    moisture: number;
    weirdness: number;
  };
  sharpness: number;
};

const BIOMES: Record<BiomeId, BiomeDefinition> = {
  ocean: {
    id: 'ocean',
    topBlock: BlockId.Sand,
    fillerBlock: BlockId.Sand,
    elevationOffset: -16,
    reliefStrength: 0.25,
    ridgeStrength: 0,
    treeDensity: 0,
    grassDensity: 0,
    flowerDensity: 0,
    snowLineOffset: 100,
    roughness: 0.3,
  },
  river: {
    id: 'river',
    topBlock: BlockId.Sand,
    fillerBlock: BlockId.Gravel,
    elevationOffset: -8,
    reliefStrength: 0.45,
    ridgeStrength: 0.08,
    treeDensity: 0.03,
    grassDensity: 0.08,
    flowerDensity: 0.05,
    snowLineOffset: 100,
    roughness: 0.45,
  },
  plains: {
    id: 'plains',
    topBlock: BlockId.Grass,
    fillerBlock: BlockId.Dirt,
    elevationOffset: -1,
    reliefStrength: 0.75,
    ridgeStrength: 0.2,
    treeDensity: 0.02,
    grassDensity: 0.32,
    flowerDensity: 0.06,
    snowLineOffset: 100,
    roughness: 0.55,
  },
  forest: {
    id: 'forest',
    topBlock: BlockId.Grass,
    fillerBlock: BlockId.Dirt,
    elevationOffset: 1,
    reliefStrength: 0.95,
    ridgeStrength: 0.32,
    treeDensity: 0.11,
    grassDensity: 0.28,
    flowerDensity: 0.04,
    snowLineOffset: 100,
    roughness: 0.72,
  },
  flowerField: {
    id: 'flowerField',
    topBlock: BlockId.Grass,
    fillerBlock: BlockId.Dirt,
    elevationOffset: 0,
    reliefStrength: 0.82,
    ridgeStrength: 0.18,
    treeDensity: 0.012,
    grassDensity: 0.24,
    flowerDensity: 0.16,
    snowLineOffset: 100,
    roughness: 0.6,
  },
  taigaLike: {
    id: 'taigaLike',
    topBlock: BlockId.Grass,
    fillerBlock: BlockId.Dirt,
    elevationOffset: 3,
    reliefStrength: 1.05,
    ridgeStrength: 0.45,
    treeDensity: 0.08,
    grassDensity: 0.12,
    flowerDensity: 0.02,
    snowLineOffset: -8,
    roughness: 0.76,
  },
  desertLike: {
    id: 'desertLike',
    topBlock: BlockId.Sand,
    fillerBlock: BlockId.Sand,
    elevationOffset: 1,
    reliefStrength: 0.9,
    ridgeStrength: 0.28,
    treeDensity: 0,
    grassDensity: 0,
    flowerDensity: 0,
    snowLineOffset: 100,
    roughness: 0.68,
  },
  hills: {
    id: 'hills',
    topBlock: BlockId.Grass,
    fillerBlock: BlockId.Dirt,
    elevationOffset: 6,
    reliefStrength: 1.2,
    ridgeStrength: 0.58,
    treeDensity: 0.05,
    grassDensity: 0.16,
    flowerDensity: 0.03,
    snowLineOffset: 0,
    roughness: 0.88,
  },
  mountains: {
    id: 'mountains',
    topBlock: BlockId.Stone,
    fillerBlock: BlockId.Stone,
    elevationOffset: 15,
    reliefStrength: 1.5,
    ridgeStrength: 1.05,
    treeDensity: 0.02,
    grassDensity: 0.04,
    flowerDensity: 0.01,
    snowLineOffset: -14,
    roughness: 1.2,
  },
  rockyPeaks: {
    id: 'rockyPeaks',
    topBlock: BlockId.Stone,
    fillerBlock: BlockId.Stone,
    elevationOffset: 22,
    reliefStrength: 1.9,
    ridgeStrength: 1.45,
    treeDensity: 0,
    grassDensity: 0,
    flowerDensity: 0,
    snowLineOffset: -24,
    roughness: 1.35,
  },
};

const BIOME_TARGETS: BiomeTarget[] = [
  {
    ...BIOMES.ocean,
    target: { continentalness: -0.9, erosion: 0.2, temperature: 0.5, moisture: 0.6, weirdness: 0 },
    sharpness: 7,
  },
  {
    ...BIOMES.plains,
    target: { continentalness: 0.1, erosion: 0.25, temperature: 0.58, moisture: 0.52, weirdness: 0.1 },
    sharpness: 8,
  },
  {
    ...BIOMES.forest,
    target: { continentalness: 0.24, erosion: 0.25, temperature: 0.55, moisture: 0.82, weirdness: 0.02 },
    sharpness: 8.2,
  },
  {
    ...BIOMES.flowerField,
    target: { continentalness: 0.12, erosion: 0.33, temperature: 0.62, moisture: 0.68, weirdness: 0.18 },
    sharpness: 9.3,
  },
  {
    ...BIOMES.taigaLike,
    target: { continentalness: 0.3, erosion: 0.3, temperature: 0.24, moisture: 0.63, weirdness: -0.08 },
    sharpness: 8.5,
  },
  {
    ...BIOMES.desertLike,
    target: { continentalness: 0.2, erosion: 0.4, temperature: 0.9, moisture: 0.12, weirdness: 0.12 },
    sharpness: 9.2,
  },
  {
    ...BIOMES.hills,
    target: { continentalness: 0.56, erosion: -0.2, temperature: 0.52, moisture: 0.52, weirdness: 0.24 },
    sharpness: 8.5,
  },
  {
    ...BIOMES.mountains,
    target: { continentalness: 0.78, erosion: -0.62, temperature: 0.44, moisture: 0.48, weirdness: 0.42 },
    sharpness: 9.5,
  },
  {
    ...BIOMES.rockyPeaks,
    target: { continentalness: 0.93, erosion: -0.88, temperature: 0.34, moisture: 0.32, weirdness: 0.62 },
    sharpness: 10.2,
  },
];

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function scoreBiome(climate: ClimateSample, biome: BiomeDefinition): number {
  const c = climate.continentalness;
  const e = climate.erosion;
  const t = climate.temperature;
  const m = climate.moisture;
  const w = climate.weirdness;

  switch (biome.id) {
    case 'ocean':
      return c < -0.38 ? 2.2 + (-c - 0.38) * 2 : -1;
    case 'river':
      return m * 0.4 + (1 - Math.abs(e) * 0.5);
    case 'plains':
      return (1 - Math.abs(c)) + (1 - Math.abs(e)) * 0.4 + m * 0.3;
    case 'forest':
      return m * 1.3 + (1 - Math.abs(t - 0.05)) * 0.45 + (1 - Math.abs(e)) * 0.35;
    case 'flowerField':
      return m * 0.95 + t * 0.3 + (1 - Math.abs(e)) * 0.32 + (1 - Math.abs(w)) * 0.2;
    case 'taigaLike':
      return (1 - t) * 1.1 + m * 0.55 + Math.max(0, c) * 0.35;
    case 'desertLike':
      return t * 1.2 + (1 - m) * 1.1 + Math.max(0, e) * 0.35;
    case 'hills':
      return Math.max(0, c) * 0.72 + (1 - e) * 0.45 + Math.abs(w) * 0.2;
    case 'mountains':
      return Math.max(0, c) * 0.95 + (1 - e) * 0.9 + Math.max(0, w) * 0.2;
    case 'rockyPeaks':
      return Math.max(0, c - 0.2) * 1.2 + (1 - e) * 1.1 + Math.max(0, w) * 0.45;
    default:
      return 0;
  }
}

export function getBiome(id: BiomeId): BiomeDefinition {
  return BIOMES[id];
}

export function chooseBiomeBlend(climate: ClimateSample, isRiver: boolean): BiomeBlend {
  if (isRiver) {
    const river = getBiome('river');
    const side = climate.temperature > 0.62 && climate.moisture < 0.45 ? getBiome('desertLike') : getBiome('forest');
    return { primary: river, secondary: side, blend: 0.42 };
  }

  const entries = (Object.values(BIOMES) as BiomeDefinition[])
    .filter((biome) => biome.id !== 'river')
    .map((biome) => ({ biome, score: scoreBiome(climate, biome) }))
    .sort((a, b) => b.score - a.score);

  const primary = entries[0]?.biome ?? getBiome('plains');
  const secondary = entries[1]?.biome ?? primary;
  const primaryScore = Math.max(0.01, entries[0]?.score ?? 1);
  const secondaryScore = Math.max(0, entries[1]?.score ?? 0);
  const blend = clamp01(secondaryScore / (primaryScore + secondaryScore));
  return { primary, secondary, blend };
}

function climateDistanceSquared(climate: ClimateSample, target: BiomeTarget['target']): number {
  const dc = climate.continentalness - target.continentalness;
  const de = climate.erosion - target.erosion;
  const dt = climate.temperature - target.temperature;
  const dm = climate.moisture - target.moisture;
  const dw = climate.weirdness - target.weirdness;
  return dc * dc * 1.6 + de * de * 1.3 + dt * dt * 1.1 + dm * dm * 1.1 + dw * dw * 0.85;
}

export function sampleBiomeProfile(climate: ClimateSample, isRiver: boolean): BiomeProfile {
  if (isRiver) {
    const river = getBiome('river');
    const side = climate.temperature > 0.66 && climate.moisture < 0.38 ? getBiome('desertLike') : getBiome('plains');
    return {
      primary: river,
      secondary: side,
      blend: 0.32,
      elevationOffset: river.elevationOffset * 0.8 + side.elevationOffset * 0.2,
      reliefStrength: river.reliefStrength * 0.82 + side.reliefStrength * 0.18,
      ridgeStrength: river.ridgeStrength * 0.75 + side.ridgeStrength * 0.25,
      treeDensity: side.treeDensity * 0.35,
      grassDensity: side.grassDensity * 0.55,
      flowerDensity: side.flowerDensity * 0.55,
      snowLineOffset: side.snowLineOffset,
      roughness: river.roughness * 0.8 + side.roughness * 0.2,
      mountainFactor: 0,
    };
  }

  const scored = BIOME_TARGETS.map((biome) => {
    const dist2 = climateDistanceSquared(climate, biome.target);
    const weight = Math.exp(-dist2 * biome.sharpness);
    return { biome, weight };
  }).sort((a, b) => b.weight - a.weight);

  const primary = scored[0]?.biome ?? getBiome('plains');
  const secondary = scored[1]?.biome ?? primary;
  const sum = scored.reduce((acc, entry) => acc + entry.weight, 0) || 1;
  const topSum = (scored[0]?.weight ?? 0) + (scored[1]?.weight ?? 0);
  const blend = clamp01((scored[1]?.weight ?? 0) / Math.max(1e-5, topSum));

  const averaged = {
    elevationOffset: 0,
    reliefStrength: 0,
    ridgeStrength: 0,
    treeDensity: 0,
    grassDensity: 0,
    flowerDensity: 0,
    snowLineOffset: 0,
    roughness: 0,
    mountainFactor: 0,
  };

  for (const entry of scored) {
    const w = entry.weight / sum;
    averaged.elevationOffset += entry.biome.elevationOffset * w;
    averaged.reliefStrength += entry.biome.reliefStrength * w;
    averaged.ridgeStrength += entry.biome.ridgeStrength * w;
    averaged.treeDensity += entry.biome.treeDensity * w;
    averaged.grassDensity += entry.biome.grassDensity * w;
    averaged.flowerDensity += entry.biome.flowerDensity * w;
    averaged.snowLineOffset += entry.biome.snowLineOffset * w;
    averaged.roughness += entry.biome.roughness * w;
    if (entry.biome.id === 'mountains' || entry.biome.id === 'rockyPeaks') {
      averaged.mountainFactor += w;
    }
  }

  return {
    primary,
    secondary,
    blend,
    elevationOffset: averaged.elevationOffset,
    reliefStrength: averaged.reliefStrength,
    ridgeStrength: averaged.ridgeStrength,
    treeDensity: averaged.treeDensity,
    grassDensity: averaged.grassDensity,
    flowerDensity: averaged.flowerDensity,
    snowLineOffset: Math.round(averaged.snowLineOffset),
    roughness: averaged.roughness,
    mountainFactor: clamp01(averaged.mountainFactor * 1.6),
  };
}
