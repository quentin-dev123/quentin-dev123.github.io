import { SEA_LEVEL } from '../constants';
import { NoiseSampler } from './NoiseSampler';

export type RiverInfo = {
  isRiver: boolean;
  carveDepth: number;
  blend: number;
  waterLevel: number;
};

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

export class RiverGenerator {
  getRiverInfo(noise: NoiseSampler, wx: number, wz: number): RiverInfo {
    const warped = noise.warp2D(wx, wz, 0.0038, 26);
    const signal = Math.abs(noise.fbm2D(warped.wx, warped.wz, 0.00165, 4, 2, 0.5));
    const widthMask = noise.fbm2D(warped.wx + 1000, warped.wz - 1000, 0.0022, 3, 2, 0.52);
    const threshold = 0.1 + widthMask * 0.05;

    if (signal > threshold) {
      return { isRiver: false, carveDepth: 0, blend: 0, waterLevel: SEA_LEVEL };
    }

    const normalized = clamp01(1 - signal / Math.max(0.001, threshold));
    const smooth = normalized * normalized * (3 - 2 * normalized);
    const carveDepth = 2 + smooth * 6;
    return {
      isRiver: true,
      carveDepth,
      blend: smooth,
      waterLevel: SEA_LEVEL + 1,
    };
  }
}
