import { Vector3 } from 'three';
import { BlockId, isSolidBlock, isWaterBlock } from '../world/BlockTypes';
import { PLAYER_HALF_WIDTH, PLAYER_HEIGHT } from '../world/constants';

type GetBlockAtWorld = (wx: number, wy: number, wz: number) => BlockId;

const EPSILON = 1e-5;
const STEP_UNIT = 0.2;

export type MotionResult = {
  position: Vector3;
  velocity: Vector3;
  grounded: boolean;
  inWater: boolean;
};

export class VoxelPhysics {
  private readonly getBlockAtWorld: GetBlockAtWorld;

  constructor(getBlockAtWorld: GetBlockAtWorld) {
    this.getBlockAtWorld = getBlockAtWorld;
  }

  move(position: Vector3, velocity: Vector3, dt: number): MotionResult {
    const nextPos = position.clone();
    const nextVel = velocity.clone();
    let grounded = false;

    grounded = this.moveAxis(nextPos, nextVel, 'x', nextVel.x * dt) || grounded;
    grounded = this.moveAxis(nextPos, nextVel, 'z', nextVel.z * dt) || grounded;
    grounded = this.moveAxis(nextPos, nextVel, 'y', nextVel.y * dt) || grounded;

    const inWater = this.isInWater(nextPos);
    return { position: nextPos, velocity: nextVel, grounded, inWater };
  }

  private moveAxis(position: Vector3, velocity: Vector3, axis: 'x' | 'y' | 'z', delta: number): boolean {
    if (Math.abs(delta) < EPSILON) {
      return false;
    }

    const steps = Math.max(1, Math.ceil(Math.abs(delta) / STEP_UNIT));
    const step = delta / steps;
    let grounded = false;

    for (let i = 0; i < steps; i += 1) {
      this.addAxis(position, axis, step);
      if (!this.collidesAt(position)) {
        continue;
      }

      this.addAxis(position, axis, -step);
      this.setAxis(velocity, axis, 0);

      if (axis === 'y' && step < 0) {
        grounded = true;
      }
      break;
    }

    return grounded;
  }

  private addAxis(vec: Vector3, axis: 'x' | 'y' | 'z', value: number): void {
    if (axis === 'x') vec.x += value;
    else if (axis === 'y') vec.y += value;
    else vec.z += value;
  }

  private setAxis(vec: Vector3, axis: 'x' | 'y' | 'z', value: number): void {
    if (axis === 'x') vec.x = value;
    else if (axis === 'y') vec.y = value;
    else vec.z = value;
  }

  private collidesAt(pos: Vector3): boolean {
    const minX = Math.floor(pos.x - PLAYER_HALF_WIDTH);
    const maxX = Math.floor(pos.x + PLAYER_HALF_WIDTH);
    const minY = Math.floor(pos.y);
    const maxY = Math.floor(pos.y + PLAYER_HEIGHT - EPSILON);
    const minZ = Math.floor(pos.z - PLAYER_HALF_WIDTH);
    const maxZ = Math.floor(pos.z + PLAYER_HALF_WIDTH);

    for (let y = minY; y <= maxY; y += 1) {
      for (let z = minZ; z <= maxZ; z += 1) {
        for (let x = minX; x <= maxX; x += 1) {
          const block = this.getBlockAtWorld(x, y, z);
          if (isSolidBlock(block)) {
            return true;
          }
        }
      }
    }
    return false;
  }

  isInWater(pos: Vector3): boolean {
    const minX = Math.floor(pos.x - PLAYER_HALF_WIDTH);
    const maxX = Math.floor(pos.x + PLAYER_HALF_WIDTH);
    const minY = Math.floor(pos.y + 0.15);
    const maxY = Math.floor(pos.y + PLAYER_HEIGHT - 0.25);
    const minZ = Math.floor(pos.z - PLAYER_HALF_WIDTH);
    const maxZ = Math.floor(pos.z + PLAYER_HALF_WIDTH);

    for (let y = minY; y <= maxY; y += 1) {
      for (let z = minZ; z <= maxZ; z += 1) {
        for (let x = minX; x <= maxX; x += 1) {
          const block = this.getBlockAtWorld(x, y, z);
          if (isWaterBlock(block)) {
            return true;
          }
        }
      }
    }
    return false;
  }
}
