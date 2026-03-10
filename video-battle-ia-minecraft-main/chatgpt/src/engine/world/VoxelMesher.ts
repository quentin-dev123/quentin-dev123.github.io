import { BoxGeometry, DynamicDrawUsage, Group, InstancedMesh, Matrix4, MeshStandardMaterial, Object3D, PlaneGeometry } from 'three';
import { TextureGenerator } from '../textures/TextureGenerator';
import { BlockId, getBlockRenderType, isOpaqueBlock, isWaterBlock } from './BlockTypes';
import { Chunk } from './Chunk';
import { CHUNK_SIZE_X, CHUNK_SIZE_Y, CHUNK_SIZE_Z } from './constants';

type BlockMaterial = MeshStandardMaterial | MeshStandardMaterial[];
type GetBlockAtWorld = (wx: number, wy: number, wz: number) => BlockId;

const TEMP_OBJECT = new Object3D();
const TEMP_MATRIX = new Matrix4();
const BLOCK_GEOMETRY = new BoxGeometry(1, 1, 1);
const CROSS_GEOMETRY = new PlaneGeometry(1, 1);

export class VoxelMesher {
  buildChunkGroup(
    chunk: Chunk,
    getBlockAtWorld: GetBlockAtWorld,
    textures: TextureGenerator,
  ): Group {
    const group = new Group();
    group.name = `chunk-${chunk.cx}-${chunk.cz}`;

    const perCubePositions = new Map<BlockId, Array<{ x: number; y: number; z: number }>>();
    const perCrossPositions = new Map<BlockId, Array<{ x: number; y: number; z: number }>>();

    for (let y = 0; y < CHUNK_SIZE_Y; y += 1) {
      for (let z = 0; z < CHUNK_SIZE_Z; z += 1) {
        for (let x = 0; x < CHUNK_SIZE_X; x += 1) {
          const block = chunk.get(x, y, z);
          if (block === BlockId.Air) {
            continue;
          }

          const wx = chunk.cx * CHUNK_SIZE_X + x;
          const wz = chunk.cz * CHUNK_SIZE_Z + z;
          const renderType = getBlockRenderType(block);
          if (renderType === 'cube' && !this.hasVisibleFace(getBlockAtWorld, block, wx, y, wz)) {
            continue;
          }

          const target = renderType === 'cross' ? perCrossPositions : perCubePositions;
          if (!target.has(block)) {
            target.set(block, []);
          }
          target.get(block)?.push({ x: wx + 0.5, y: y + 0.5, z: wz + 0.5 });
        }
      }
    }

    for (const [block, list] of perCubePositions.entries()) {
      const material = textures.getMaterialsForBlock(block) as BlockMaterial;
      const mesh = new InstancedMesh(BLOCK_GEOMETRY, material, list.length);
      this.fillInstances(mesh, list, 0);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      group.add(mesh);
    }

    for (const [block, list] of perCrossPositions.entries()) {
      const material = textures.getMaterialsForBlock(block) as BlockMaterial;
      const front = new InstancedMesh(CROSS_GEOMETRY, material, list.length);
      const back = new InstancedMesh(CROSS_GEOMETRY, material, list.length);
      this.fillInstances(front, list, Math.PI * 0.25);
      this.fillInstances(back, list, -Math.PI * 0.25);
      front.castShadow = true;
      front.receiveShadow = true;
      back.castShadow = true;
      back.receiveShadow = true;
      group.add(front);
      group.add(back);
    }

    return group;
  }

  private fillInstances(mesh: InstancedMesh, list: Array<{ x: number; y: number; z: number }>, yaw: number): void {
    mesh.instanceMatrix.setUsage(DynamicDrawUsage);
    for (let i = 0; i < list.length; i += 1) {
      const instance = list[i];
      TEMP_OBJECT.position.set(instance.x, instance.y, instance.z);
      TEMP_OBJECT.rotation.set(0, yaw, 0);
      TEMP_OBJECT.scale.set(1, 1, 1);
      TEMP_OBJECT.updateMatrix();
      TEMP_MATRIX.copy(TEMP_OBJECT.matrix);
      mesh.setMatrixAt(i, TEMP_MATRIX);
    }
    mesh.instanceMatrix.needsUpdate = true;
  }

  private hasVisibleFace(getBlockAtWorld: GetBlockAtWorld, current: BlockId, wx: number, wy: number, wz: number): boolean {
    if (this.isFaceVisible(current, getBlockAtWorld(wx + 1, wy, wz))) return true;
    if (this.isFaceVisible(current, getBlockAtWorld(wx - 1, wy, wz))) return true;
    if (this.isFaceVisible(current, getBlockAtWorld(wx, wy + 1, wz))) return true;
    if (this.isFaceVisible(current, getBlockAtWorld(wx, wy - 1, wz))) return true;
    if (this.isFaceVisible(current, getBlockAtWorld(wx, wy, wz + 1))) return true;
    if (this.isFaceVisible(current, getBlockAtWorld(wx, wy, wz - 1))) return true;
    return false;
  }

  private isFaceVisible(current: BlockId, neighbor: BlockId): boolean {
    if (neighbor === BlockId.Air) {
      return true;
    }
    if (isWaterBlock(current) && isWaterBlock(neighbor)) {
      return false;
    }
    if (neighbor === current) {
      return false;
    }
    return !isOpaqueBlock(neighbor);
  }
}
