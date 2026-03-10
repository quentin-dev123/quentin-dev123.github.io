import { BlockId } from '../BlockTypes';
import { CHUNK_SIZE_Y } from '../constants';
import { NoiseSampler } from './NoiseSampler';

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

export class CaveGenerator {
  shouldCarve(
    noise: NoiseSampler,
    wx: number,
    y: number,
    wz: number,
    surfaceHeight: number,
    mountainFactor: number,
  ): boolean {
    if (y <= 3 || y >= surfaceHeight - 4 || y >= CHUNK_SIZE_Y - 2) {
      return false;
    }

    const depth = surfaceHeight - y;
    const depthMask = clamp01(depth / 24);
    if (depthMask <= 0.1) {
      return false;
    }

    const cellNoise = noise.fbm3D(wx, y, wz, 0.045, 3, 2, 0.52);
    const tunnelNoise = Math.abs(noise.fbm3D(wx + 300, y - 150, wz - 220, 0.023, 4, 2, 0.55));
    const verticalBias = Math.abs(noise.sample3D(wx - 420, y, wz + 140, 0.03));

    const combined = cellNoise * 0.58 + tunnelNoise * 0.66 - verticalBias * 0.1;
    const threshold = 0.36 + (1 - depthMask) * 0.27 + mountainFactor * 0.06;
    return combined > threshold;
  }

  carvePass(
    noise: NoiseSampler,
    wx: number,
    wz: number,
    topHeight: number,
    mountainFactor: number,
    setBlock: (y: number, block: BlockId) => void,
  ): void {
    for (let y = 4; y < topHeight - 3; y += 1) {
      if (this.shouldCarve(noise, wx, y, wz, topHeight, mountainFactor)) {
        setBlock(y, BlockId.Air);
      }
    }
  }
}
