import { CHUNK_SIZE_Y, SEA_LEVEL } from '../constants';
import { type BiomeProfile } from './Biome';
import { NoiseSampler } from './NoiseSampler';
import { type RiverInfo } from './RiverGenerator';

export class HeightModel {
  computeSurfaceHeight(noise: NoiseSampler, wx: number, wz: number, biome: BiomeProfile, riverInfo: RiverInfo): number {
    const elevationOffset = biome.elevationOffset;
    const reliefStrength = biome.reliefStrength;
    const ridgeStrength = biome.ridgeStrength;
    const roughness = biome.roughness;

    const macro = noise.fbm2D(wx, wz, 0.0022, 5, 2, 0.52);
    const mid = noise.fbm2D(wx, wz, 0.0088, 4, 2, 0.55);
    const detail = noise.fbm2D(wx, wz, 0.022, 2, 2, 0.5);
    const ridged = noise.ridged2D(wx + 5000, wz - 5000, 0.0062, 4, 2, 0.56);
    const erosionValley = noise.fbm2D(wx - 7000, wz + 2600, 0.0036, 3, 2, 0.55);
    const valleyFactor = Math.max(0, -erosionValley);
    const softener = 1 - biome.mountainFactor * 0.4;

    let height =
      SEA_LEVEL +
      elevationOffset +
      macro * 13 * reliefStrength +
      mid * 8.5 * roughness +
      detail * 2.3 +
      ridged * 10.5 * ridgeStrength * softener +
      ridged * 6.2 * biome.mountainFactor -
      valleyFactor * 5.5 * (0.7 + biome.mountainFactor * 0.6);

    if (riverInfo.isRiver) {
      height -= riverInfo.carveDepth * riverInfo.blend;
    }

    const minHeight = 6;
    const maxHeight = CHUNK_SIZE_Y - 6;
    height = Math.max(minHeight, Math.min(maxHeight, height));
    return Math.floor(height);
  }
}
