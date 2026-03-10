import { BlockId } from './BlockTypes';
import { CHUNK_SIZE_X, CHUNK_SIZE_Y, CHUNK_SIZE_Z } from './constants';

export class Chunk {
  readonly cx: number;
  readonly cz: number;
  readonly voxels: Uint8Array;
  dirty = true;

  constructor(cx: number, cz: number) {
    this.cx = cx;
    this.cz = cz;
    this.voxels = new Uint8Array(CHUNK_SIZE_X * CHUNK_SIZE_Y * CHUNK_SIZE_Z);
  }

  private index(x: number, y: number, z: number): number {
    return x + z * CHUNK_SIZE_X + y * CHUNK_SIZE_X * CHUNK_SIZE_Z;
  }

  inBounds(x: number, y: number, z: number): boolean {
    return (
      x >= 0 &&
      x < CHUNK_SIZE_X &&
      y >= 0 &&
      y < CHUNK_SIZE_Y &&
      z >= 0 &&
      z < CHUNK_SIZE_Z
    );
  }

  get(x: number, y: number, z: number): BlockId {
    if (!this.inBounds(x, y, z)) {
      return BlockId.Air;
    }
    return this.voxels[this.index(x, y, z)] as BlockId;
  }

  set(x: number, y: number, z: number, block: BlockId): void {
    if (!this.inBounds(x, y, z)) {
      return;
    }
    this.voxels[this.index(x, y, z)] = block;
    this.dirty = true;
  }
}
