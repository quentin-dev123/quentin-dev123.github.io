import { Group, Scene } from 'three';
import { TextureGenerator } from '../textures/TextureGenerator';
import { BlockId, getFlowBlockForLevel, getWaterLevel, isSolidBlock, isWaterBlock } from './BlockTypes';
import { Chunk } from './Chunk';
import { VoxelMesher } from './VoxelMesher';
import { CHUNK_SIZE_X, CHUNK_SIZE_Y, CHUNK_SIZE_Z, WORLD_RENDER_RADIUS } from './constants';
import { WorldGenerator } from './generation/WorldGenerator';

type ChunkKey = string;

function chunkKey(cx: number, cz: number): ChunkKey {
  return `${cx},${cz}`;
}

type ChunkManagerOptions = {
  seed?: string;
  renderRadius?: number;
};

type WaterNode = { x: number; y: number; z: number };

export class ChunkManager {
  private readonly scene: Scene;
  private readonly textures: TextureGenerator;
  private readonly mesher = new VoxelMesher();
  private readonly worldGenerator: WorldGenerator;
  private readonly chunks = new Map<ChunkKey, Chunk>();
  private readonly chunkGroups = new Map<ChunkKey, Group>();
  private renderRadius: number;
  private readonly waterQueue: WaterNode[] = [];
  private readonly waterQueued = new Set<string>();
  private fluidAccumulator = 0;

  constructor(scene: Scene, textures: TextureGenerator, options: ChunkManagerOptions = {}) {
    this.scene = scene;
    this.textures = textures;
    this.worldGenerator = new WorldGenerator({ seed: options.seed });
    this.renderRadius = Math.max(2, Math.floor(options.renderRadius ?? WORLD_RENDER_RADIUS));
  }

  initialize(centerChunkX = 0, centerChunkZ = 0): void {
    this.streamChunks(centerChunkX, centerChunkZ, (this.renderRadius * 2 + 1) ** 2);
    this.rebuildDirtyChunks();
  }

  update(playerX: number, playerZ: number, dt: number): void {
    const centerChunkX = Math.floor(playerX / CHUNK_SIZE_X);
    const centerChunkZ = Math.floor(playerZ / CHUNK_SIZE_Z);
    this.streamChunks(centerChunkX, centerChunkZ, 12);
    this.stepFluid(dt);
  }

  setRenderRadius(radius: number): void {
    this.renderRadius = Math.max(2, Math.min(10, Math.floor(radius)));
  }

  rebuildDirtyChunks(): void {
    for (const [key, chunk] of this.chunks.entries()) {
      if (!chunk.dirty) {
        continue;
      }
      const existing = this.chunkGroups.get(key);
      if (existing) {
        this.scene.remove(existing);
      }
      const group = this.mesher.buildChunkGroup(chunk, this.getBlockAtWorld.bind(this), this.textures);
      this.scene.add(group);
      this.chunkGroups.set(key, group);
      chunk.dirty = false;
    }
  }

  getBlockAtWorld(wx: number, wy: number, wz: number): BlockId {
    if (wy < 0 || wy >= CHUNK_SIZE_Y) {
      return BlockId.Air;
    }
    const cx = Math.floor(wx / CHUNK_SIZE_X);
    const cz = Math.floor(wz / CHUNK_SIZE_Z);
    const localX = ((wx % CHUNK_SIZE_X) + CHUNK_SIZE_X) % CHUNK_SIZE_X;
    const localZ = ((wz % CHUNK_SIZE_Z) + CHUNK_SIZE_Z) % CHUNK_SIZE_Z;
    const chunk = this.chunks.get(chunkKey(cx, cz));
    if (!chunk) {
      return BlockId.Air;
    }
    return chunk.get(localX, wy, localZ);
  }

  setBlockAtWorld(wx: number, wy: number, wz: number, block: BlockId): void {
    if (wy < 0 || wy >= CHUNK_SIZE_Y) {
      return;
    }
    const cx = Math.floor(wx / CHUNK_SIZE_X);
    const cz = Math.floor(wz / CHUNK_SIZE_Z);
    const localX = ((wx % CHUNK_SIZE_X) + CHUNK_SIZE_X) % CHUNK_SIZE_X;
    const localZ = ((wz % CHUNK_SIZE_Z) + CHUNK_SIZE_Z) % CHUNK_SIZE_Z;
    const chunk = this.ensureChunk(cx, cz);
    if (chunk.get(localX, wy, localZ) === block) {
      return;
    }
    chunk.set(localX, wy, localZ, block);

    // Si un bloc de bordure change, les chunks voisins doivent aussi etre rebuild.
    if (localX === 0) this.markDirty(cx - 1, cz);
    if (localX === CHUNK_SIZE_X - 1) this.markDirty(cx + 1, cz);
    if (localZ === 0) this.markDirty(cx, cz - 1);
    if (localZ === CHUNK_SIZE_Z - 1) this.markDirty(cx, cz + 1);
    this.enqueueWaterAround(wx, wy, wz);
  }

  getSurfaceY(wx: number, wz: number): number {
    for (let y = CHUNK_SIZE_Y - 1; y >= 0; y -= 1) {
      const block = this.getBlockAtWorld(wx, y, wz);
      if (isSolidBlock(block)) {
        return y;
      }
    }
    return 0;
  }

  private ensureChunk(cx: number, cz: number): Chunk {
    const key = chunkKey(cx, cz);
    const existing = this.chunks.get(key);
    if (existing) {
      return existing;
    }

    const chunk = new Chunk(cx, cz);
    this.worldGenerator.generateChunk(chunk);
    this.chunks.set(key, chunk);
    return chunk;
  }

  private markDirty(cx: number, cz: number): void {
    const chunk = this.chunks.get(chunkKey(cx, cz));
    if (chunk) {
      chunk.dirty = true;
    }
  }

  private streamChunks(centerCx: number, centerCz: number, budget: number): void {
    const wanted: Array<{ cx: number; cz: number; d2: number }> = [];
    for (let dz = -this.renderRadius; dz <= this.renderRadius; dz += 1) {
      for (let dx = -this.renderRadius; dx <= this.renderRadius; dx += 1) {
        const cx = centerCx + dx;
        const cz = centerCz + dz;
        wanted.push({ cx, cz, d2: dx * dx + dz * dz });
      }
    }
    wanted.sort((a, b) => a.d2 - b.d2);

    let generated = 0;
    for (const candidate of wanted) {
      if (generated >= budget) {
        break;
      }
      const key = chunkKey(candidate.cx, candidate.cz);
      if (this.chunks.has(key)) {
        continue;
      }
      this.ensureChunk(candidate.cx, candidate.cz);
      generated += 1;
    }

    for (const [key, chunk] of this.chunks) {
      if (
        Math.abs(chunk.cx - centerCx) > this.renderRadius + 1 ||
        Math.abs(chunk.cz - centerCz) > this.renderRadius + 1
      ) {
        const group = this.chunkGroups.get(key);
        if (group) {
          this.scene.remove(group);
          this.chunkGroups.delete(key);
        }
        this.chunks.delete(key);
      }
    }
  }

  private enqueueWaterAround(wx: number, wy: number, wz: number): void {
    const neighbors = [
      { x: wx, y: wy, z: wz },
      { x: wx + 1, y: wy, z: wz },
      { x: wx - 1, y: wy, z: wz },
      { x: wx, y: wy, z: wz + 1 },
      { x: wx, y: wy, z: wz - 1 },
      { x: wx, y: wy + 1, z: wz },
      { x: wx, y: wy - 1, z: wz },
    ];
    for (const neighbor of neighbors) {
      if (neighbor.y < 0 || neighbor.y >= CHUNK_SIZE_Y) continue;
      if (!this.hasLoadedChunkAtWorld(neighbor.x, neighbor.z)) continue;
      const key = `${neighbor.x},${neighbor.y},${neighbor.z}`;
      if (this.waterQueued.has(key)) continue;
      this.waterQueued.add(key);
      this.waterQueue.push(neighbor);
    }
  }

  private stepFluid(dt: number): void {
    this.fluidAccumulator += dt;
    const TICK_SECONDS = 0.08;
    while (this.fluidAccumulator >= TICK_SECONDS) {
      this.fluidAccumulator -= TICK_SECONDS;
      this.stepFluidTick();
    }
  }

  private stepFluidTick(): void {
    const updatesPerTick = 120;
    for (let i = 0; i < updatesPerTick; i += 1) {
      const node = this.waterQueue.pop();
      if (!node) {
        return;
      }
      this.waterQueued.delete(`${node.x},${node.y},${node.z}`);
      this.processFluidNode(node.x, node.y, node.z);
    }
  }

  private processFluidNode(wx: number, wy: number, wz: number): void {
    const block = this.getBlockAtWorld(wx, wy, wz);
    if (!isWaterBlock(block)) {
      return;
    }

    const level = getWaterLevel(block);
    const belowY = wy - 1;
    if (belowY >= 0) {
      const below = this.getBlockAtWorld(wx, belowY, wz);
      if (below === BlockId.Air) {
        const downLevel = Math.min(7, level + 1);
        if (this.setFluidIfBetter(wx, belowY, wz, downLevel)) {
          this.enqueueWaterAround(wx, belowY, wz);
        }
      }
    }

    const below = wy > 0 ? this.getBlockAtWorld(wx, wy - 1, wz) : BlockId.Stone;
    const canSpreadSideways = level < 7 && (isSolidBlock(below) || isWaterBlock(below));
    if (canSpreadSideways) {
      const nextLevel = Math.min(7, level + 1);
      const dirs = [
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1],
      ] as const;
      for (const [dx, dz] of dirs) {
        const nx = wx + dx;
        const nz = wz + dz;
        const neighbor = this.getBlockAtWorld(nx, wy, nz);
        if (neighbor === BlockId.Air || (isWaterBlock(neighbor) && getWaterLevel(neighbor) > nextLevel)) {
          if (this.setFluidIfBetter(nx, wy, nz, nextLevel)) {
            this.enqueueWaterAround(nx, wy, nz);
          }
        }
      }
    }

    if (level > 0) {
      const supported =
        (wy + 1 < CHUNK_SIZE_Y && isWaterBlock(this.getBlockAtWorld(wx, wy + 1, wz))) ||
        isWaterBlock(this.getBlockAtWorld(wx + 1, wy, wz)) ||
        isWaterBlock(this.getBlockAtWorld(wx - 1, wy, wz)) ||
        isWaterBlock(this.getBlockAtWorld(wx, wy, wz + 1)) ||
        isWaterBlock(this.getBlockAtWorld(wx, wy, wz - 1));
      if (!supported) {
        if (this.setLoadedBlockAtWorld(wx, wy, wz, BlockId.Air)) {
          this.enqueueWaterAround(wx, wy, wz);
        }
      }
    }
  }

  private setFluidIfBetter(wx: number, wy: number, wz: number, level: number): boolean {
    if (wy < 0 || wy >= CHUNK_SIZE_Y || !this.hasLoadedChunkAtWorld(wx, wz)) {
      return false;
    }
    const target = getFlowBlockForLevel(level);
    const current = this.getBlockAtWorld(wx, wy, wz);
    if (current === target) {
      return false;
    }
    if (current !== BlockId.Air && !isWaterBlock(current)) {
      return false;
    }
    if (isWaterBlock(current) && getWaterLevel(current) <= level) {
      return false;
    }
    return this.setLoadedBlockAtWorld(wx, wy, wz, target);
  }

  private setLoadedBlockAtWorld(wx: number, wy: number, wz: number, block: BlockId): boolean {
    const cx = Math.floor(wx / CHUNK_SIZE_X);
    const cz = Math.floor(wz / CHUNK_SIZE_Z);
    const chunk = this.chunks.get(chunkKey(cx, cz));
    if (!chunk) {
      return false;
    }
    const localX = ((wx % CHUNK_SIZE_X) + CHUNK_SIZE_X) % CHUNK_SIZE_X;
    const localZ = ((wz % CHUNK_SIZE_Z) + CHUNK_SIZE_Z) % CHUNK_SIZE_Z;
    if (chunk.get(localX, wy, localZ) === block) {
      return false;
    }
    chunk.set(localX, wy, localZ, block);
    if (localX === 0) this.markDirty(cx - 1, cz);
    if (localX === CHUNK_SIZE_X - 1) this.markDirty(cx + 1, cz);
    if (localZ === 0) this.markDirty(cx, cz - 1);
    if (localZ === CHUNK_SIZE_Z - 1) this.markDirty(cx, cz + 1);
    return true;
  }

  private hasLoadedChunkAtWorld(wx: number, wz: number): boolean {
    const cx = Math.floor(wx / CHUNK_SIZE_X);
    const cz = Math.floor(wz / CHUNK_SIZE_Z);
    return this.chunks.has(chunkKey(cx, cz));
  }

}
