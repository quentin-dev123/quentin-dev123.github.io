import { createNoise2D, createNoise3D } from 'simplex-noise';

function xmur3(seed: string): () => number {
  let h = 1779033703 ^ seed.length;
  for (let i = 0; i < seed.length; i += 1) {
    h = Math.imul(h ^ seed.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return () => {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    h ^= h >>> 16;
    return h >>> 0;
  };
}

function mulberry32(seed: number): () => number {
  return () => {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function fract(value: number): number {
  return value - Math.floor(value);
}

export class NoiseSampler {
  private readonly noise2D: ReturnType<typeof createNoise2D>;
  private readonly noise3D: ReturnType<typeof createNoise3D>;

  constructor(seed: string) {
    const seedFn = xmur3(seed);
    const random = mulberry32(seedFn());
    this.noise2D = createNoise2D(random);
    this.noise3D = createNoise3D(random);
  }

  sample2D(x: number, z: number, frequency: number): number {
    return this.noise2D(x * frequency, z * frequency);
  }

  sample3D(x: number, y: number, z: number, frequency: number): number {
    return this.noise3D(x * frequency, y * frequency, z * frequency);
  }

  fbm2D(
    x: number,
    z: number,
    frequency: number,
    octaves: number,
    lacunarity: number,
    gain: number,
  ): number {
    let amplitude = 1;
    let sum = 0;
    let normalization = 0;
    let f = frequency;
    for (let i = 0; i < octaves; i += 1) {
      sum += this.sample2D(x, z, f) * amplitude;
      normalization += amplitude;
      f *= lacunarity;
      amplitude *= gain;
    }
    return normalization > 0 ? sum / normalization : 0;
  }

  fbm3D(
    x: number,
    y: number,
    z: number,
    frequency: number,
    octaves: number,
    lacunarity: number,
    gain: number,
  ): number {
    let amplitude = 1;
    let sum = 0;
    let normalization = 0;
    let f = frequency;
    for (let i = 0; i < octaves; i += 1) {
      sum += this.sample3D(x, y, z, f) * amplitude;
      normalization += amplitude;
      f *= lacunarity;
      amplitude *= gain;
    }
    return normalization > 0 ? sum / normalization : 0;
  }

  ridged2D(
    x: number,
    z: number,
    frequency: number,
    octaves: number,
    lacunarity: number,
    gain: number,
  ): number {
    let amplitude = 1;
    let sum = 0;
    let normalization = 0;
    let f = frequency;
    for (let i = 0; i < octaves; i += 1) {
      const n = this.sample2D(x, z, f);
      const ridge = 1 - Math.abs(n);
      sum += ridge * amplitude;
      normalization += amplitude;
      f *= lacunarity;
      amplitude *= gain;
    }
    const value = normalization > 0 ? sum / normalization : 0;
    return value * 2 - 1;
  }

  warp2D(x: number, z: number, warpFrequency: number, warpStrength: number): { wx: number; wz: number } {
    const offsetX = this.sample2D(x + 137.1, z - 91.7, warpFrequency) * warpStrength;
    const offsetZ = this.sample2D(x - 213.4, z + 58.2, warpFrequency) * warpStrength;
    return { wx: x + offsetX, wz: z + offsetZ };
  }

  hash2D(x: number, z: number, salt: number): number {
    const n = Math.sin(x * 127.1 + z * 311.7 + salt * 91.3) * 43758.5453123;
    return fract(n);
  }
}
