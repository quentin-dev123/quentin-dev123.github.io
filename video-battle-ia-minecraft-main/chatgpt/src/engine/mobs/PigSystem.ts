import { Group, Mesh, Vector3, type Scene } from 'three';
import { BlockId, isSolidBlock, isWaterBlock } from '../world/BlockTypes';
import { createPigModel } from './PigModel';

type WorldBlockGetter = (x: number, y: number, z: number) => BlockId;
type SurfaceGetter = (x: number, z: number) => number;

type PigEntity = {
  id: number;
  root: Group;
  legFL: Mesh;
  legFR: Mesh;
  legBL: Mesh;
  legBR: Mesh;
  position: Vector3;
  velocity: Vector3;
  desiredDir: Vector3;
  walkTimer: number;
  walkCycle: number;
  health: number;
  aggressiveUntil: number;
  attackCooldown: number;
  hurtTimer: number;
};

const PIG_HALF_WIDTH = 0.45;
const PIG_HEIGHT = 1.4;
const PIG_ATTACK_RANGE = 1.35;
const PIG_AGGRO_RANGE = 18;
const PIG_WANDER_SPEED = 1.15;
const PIG_CHASE_SPEED = 2.85;
const PIG_GRAVITY = 24;
const PIG_MAX_FALL_SPEED = 36;
const PIG_ATTACK_DAMAGE = 2;
const PIG_ATTACK_COOLDOWN = 0.8;
const PLAYER_HIT_RANGE = 4.2;
const PLAYER_HIT_DAMAGE = 4;
const MAX_PIG_COUNT = 10;

export class PigSystem {
  private readonly scene: Scene;
  private readonly getBlockAtWorld: WorldBlockGetter;
  private readonly getSurfaceY: SurfaceGetter;
  private readonly root = new Group();
  private readonly pigs: PigEntity[] = [];
  private readonly tempA = new Vector3();
  private readonly tempB = new Vector3();
  private readonly rayDirection = new Vector3();
  private now = 0;
  private nextId = 1;
  private onPigKilled: ((position: Vector3) => void) | null = null;

  constructor(scene: Scene, getBlockAtWorld: WorldBlockGetter, getSurfaceY: SurfaceGetter) {
    this.scene = scene;
    this.getBlockAtWorld = getBlockAtWorld;
    this.getSurfaceY = getSurfaceY;
    this.root.name = 'pig-system';
    this.scene.add(this.root);
  }

  spawnAround(center: Vector3, count = 6): void {
    const spawnCount = Math.max(0, Math.min(MAX_PIG_COUNT, count));
    let attempts = 0;
    while (this.pigs.length < spawnCount && attempts < spawnCount * 18) {
      attempts += 1;
      const angle = Math.random() * Math.PI * 2;
      const radius = 6 + Math.random() * 22;
      const x = center.x + Math.cos(angle) * radius;
      const z = center.z + Math.sin(angle) * radius;
      const worldX = Math.floor(x);
      const worldZ = Math.floor(z);
      const surface = this.getSurfaceY(worldX, worldZ);
      if (!Number.isFinite(surface)) {
        continue;
      }
      const floorBlock = this.getBlockAtWorld(worldX, surface, worldZ);
      if (isWaterBlock(floorBlock)) {
        continue;
      }

      const spawnY = surface + 1;
      if (!this.isAreaFree(x, spawnY, z)) {
        continue;
      }
      this.spawnPig(x, spawnY, z);
    }
  }

  update(
    dt: number,
    playerPosition: Vector3,
    allowCombat: boolean,
    onPlayerDamage: (damage: number) => void,
    onPigKilled?: (position: Vector3) => void,
  ): void {
    this.onPigKilled = onPigKilled ?? null;
    this.now += dt;
    for (let i = this.pigs.length - 1; i >= 0; i -= 1) {
      const pig = this.pigs[i];
      pig.attackCooldown = Math.max(0, pig.attackCooldown - dt);
      pig.hurtTimer = Math.max(0, pig.hurtTimer - dt);

      const toPlayerX = playerPosition.x - pig.position.x;
      const toPlayerZ = playerPosition.z - pig.position.z;
      const horizontalDistance = Math.hypot(toPlayerX, toPlayerZ);
      const isAggressive = pig.aggressiveUntil > this.now && horizontalDistance < PIG_AGGRO_RANGE;

      if (isAggressive) {
        if (horizontalDistance > 0.001) {
          pig.desiredDir.set(toPlayerX / horizontalDistance, 0, toPlayerZ / horizontalDistance);
        }
        pig.walkTimer = 0;
      } else {
        pig.walkTimer -= dt;
        if (pig.walkTimer <= 0) {
          const angle = Math.random() * Math.PI * 2;
          pig.desiredDir.set(Math.cos(angle), 0, Math.sin(angle));
          pig.walkTimer = 1.6 + Math.random() * 3.4;
        }
      }

      const targetSpeed = isAggressive ? PIG_CHASE_SPEED : PIG_WANDER_SPEED;
      const blend = Math.min(1, dt * (isAggressive ? 10 : 4));
      const desiredVX = pig.desiredDir.x * targetSpeed;
      const desiredVZ = pig.desiredDir.z * targetSpeed;
      pig.velocity.x += (desiredVX - pig.velocity.x) * blend;
      pig.velocity.z += (desiredVZ - pig.velocity.z) * blend;
      pig.velocity.y = Math.max(-PIG_MAX_FALL_SPEED, pig.velocity.y - PIG_GRAVITY * dt);

      this.movePig(pig, dt);
      this.syncPigVisual(pig);

      if (allowCombat && isAggressive && horizontalDistance <= PIG_ATTACK_RANGE && pig.attackCooldown <= 0) {
        pig.attackCooldown = PIG_ATTACK_COOLDOWN;
        onPlayerDamage(PIG_ATTACK_DAMAGE);
      }
    }
  }

  tryHitFromRay(origin: Vector3, direction: Vector3): boolean {
    this.rayDirection.copy(direction).normalize();
    let bestDistance = Number.POSITIVE_INFINITY;
    let bestPig: PigEntity | null = null;

    for (const pig of this.pigs) {
      const min = this.tempA.set(pig.position.x - PIG_HALF_WIDTH, pig.position.y, pig.position.z - PIG_HALF_WIDTH);
      const max = this.tempB.set(pig.position.x + PIG_HALF_WIDTH, pig.position.y + PIG_HEIGHT, pig.position.z + PIG_HALF_WIDTH);
      const hitDistance = intersectRayAabb(origin, this.rayDirection, min, max, PLAYER_HIT_RANGE);
      if (hitDistance === null || hitDistance >= bestDistance) {
        continue;
      }
      bestDistance = hitDistance;
      bestPig = pig;
    }

    if (!bestPig) {
      return false;
    }
    const blockDistance = this.traceSolidBlockDistance(origin, this.rayDirection, PLAYER_HIT_RANGE);
    if (blockDistance !== null && blockDistance < bestDistance) {
      return false;
    }

    bestPig.health -= PLAYER_HIT_DAMAGE;
    bestPig.hurtTimer = 0.14;
    bestPig.aggressiveUntil = Math.max(bestPig.aggressiveUntil, this.now + 18);
    bestPig.velocity.addScaledVector(this.rayDirection, 1.45);
    bestPig.velocity.y = Math.max(bestPig.velocity.y, 4.5);

    if (bestPig.health <= 0) {
      this.removePig(bestPig.id);
    }
    return true;
  }

  private spawnPig(x: number, y: number, z: number): void {
    const parts = createPigModel();
    this.root.add(parts.root);

    const pig: PigEntity = {
      id: this.nextId++,
      root: parts.root,
      legFL: parts.legFL,
      legFR: parts.legFR,
      legBL: parts.legBL,
      legBR: parts.legBR,
      position: new Vector3(x, y, z),
      velocity: new Vector3(),
      desiredDir: new Vector3(Math.random() - 0.5, 0, Math.random() - 0.5).normalize(),
      walkTimer: 1 + Math.random() * 2,
      walkCycle: Math.random() * Math.PI * 2,
      health: 10,
      aggressiveUntil: -1,
      attackCooldown: 0,
      hurtTimer: 0,
    };
    pig.root.position.copy(pig.position);
    this.pigs.push(pig);
  }

  private movePig(pig: PigEntity, dt: number): void {
    this.moveAxis(pig, 'x', pig.velocity.x * dt);
    this.moveAxis(pig, 'z', pig.velocity.z * dt);
    const collidedY = this.moveAxis(pig, 'y', pig.velocity.y * dt);
    if (collidedY && pig.velocity.y < 0) {
      pig.velocity.y = 0;
    }
  }

  private moveAxis(pig: PigEntity, axis: 'x' | 'y' | 'z', delta: number): boolean {
    if (Math.abs(delta) < 1e-5) {
      return false;
    }
    const steps = Math.max(1, Math.ceil(Math.abs(delta) / 0.18));
    const step = delta / steps;
    for (let i = 0; i < steps; i += 1) {
      addAxis(pig.position, axis, step);
      if (!this.collidesAt(pig.position)) {
        continue;
      }
      addAxis(pig.position, axis, -step);
      if (axis !== 'y') {
        setAxis(pig.velocity, axis, 0);
      }
      return true;
    }
    return false;
  }

  private collidesAt(position: Vector3): boolean {
    const minX = Math.floor(position.x - PIG_HALF_WIDTH);
    const maxX = Math.floor(position.x + PIG_HALF_WIDTH);
    const minY = Math.floor(position.y);
    const maxY = Math.floor(position.y + PIG_HEIGHT - 1e-5);
    const minZ = Math.floor(position.z - PIG_HALF_WIDTH);
    const maxZ = Math.floor(position.z + PIG_HALF_WIDTH);

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

  private syncPigVisual(pig: PigEntity): void {
    pig.root.position.copy(pig.position);
    const speed = Math.hypot(pig.velocity.x, pig.velocity.z);
    if (speed > 0.06) {
      pig.walkCycle += speed * 0.14;
      pig.root.rotation.y = Math.atan2(pig.velocity.x, pig.velocity.z);
    }
    const swing = Math.sin(pig.walkCycle * 6.8) * Math.min(0.6, speed * 0.18);
    pig.legFL.rotation.x = swing;
    pig.legBR.rotation.x = swing;
    pig.legFR.rotation.x = -swing;
    pig.legBL.rotation.x = -swing;

    if (pig.hurtTimer > 0) {
      pig.root.scale.set(1.06, 0.93, 1.06);
    } else {
      pig.root.scale.set(1, 1, 1);
    }
  }

  private isAreaFree(x: number, y: number, z: number): boolean {
    const minX = Math.floor(x - PIG_HALF_WIDTH);
    const maxX = Math.floor(x + PIG_HALF_WIDTH);
    const minY = Math.floor(y);
    const maxY = Math.floor(y + PIG_HEIGHT - 1e-5);
    const minZ = Math.floor(z - PIG_HALF_WIDTH);
    const maxZ = Math.floor(z + PIG_HALF_WIDTH);

    for (let by = minY; by <= maxY; by += 1) {
      for (let bz = minZ; bz <= maxZ; bz += 1) {
        for (let bx = minX; bx <= maxX; bx += 1) {
          if (isSolidBlock(this.getBlockAtWorld(bx, by, bz))) {
            return false;
          }
        }
      }
    }
    return true;
  }

  private removePig(id: number): void {
    const index = this.pigs.findIndex((pig) => pig.id === id);
    if (index === -1) {
      return;
    }
    const [pig] = this.pigs.splice(index, 1);
    this.root.remove(pig.root);
    this.onPigKilled?.(pig.position.clone());
  }

  private traceSolidBlockDistance(origin: Vector3, direction: Vector3, maxDistance: number): number | null {
    let prevX = Math.floor(origin.x);
    let prevY = Math.floor(origin.y);
    let prevZ = Math.floor(origin.z);

    for (let t = 0; t <= maxDistance; t += 0.1) {
      const px = origin.x + direction.x * t;
      const py = origin.y + direction.y * t;
      const pz = origin.z + direction.z * t;
      const vx = Math.floor(px);
      const vy = Math.floor(py);
      const vz = Math.floor(pz);
      if (vx === prevX && vy === prevY && vz === prevZ) {
        continue;
      }
      if (isSolidBlock(this.getBlockAtWorld(vx, vy, vz))) {
        return t;
      }
      prevX = vx;
      prevY = vy;
      prevZ = vz;
    }
    return null;
  }
}

function setAxis(v: Vector3, axis: 'x' | 'y' | 'z', value: number): void {
  if (axis === 'x') v.x = value;
  else if (axis === 'y') v.y = value;
  else v.z = value;
}

function addAxis(v: Vector3, axis: 'x' | 'y' | 'z', delta: number): void {
  if (axis === 'x') v.x += delta;
  else if (axis === 'y') v.y += delta;
  else v.z += delta;
}

function intersectRayAabb(origin: Vector3, direction: Vector3, min: Vector3, max: Vector3, maxDistance: number): number | null {
  let tMin = 0;
  let tMax = maxDistance;

  const hitX = intersectAxis(origin.x, direction.x, min.x, max.x, tMin, tMax);
  if (!hitX) {
    return null;
  }
  tMin = hitX.tMin;
  tMax = hitX.tMax;

  const hitY = intersectAxis(origin.y, direction.y, min.y, max.y, tMin, tMax);
  if (!hitY) {
    return null;
  }
  tMin = hitY.tMin;
  tMax = hitY.tMax;

  const hitZ = intersectAxis(origin.z, direction.z, min.z, max.z, tMin, tMax);
  if (!hitZ) {
    return null;
  }

  const distance = Math.max(0, hitZ.tMin);
  if (distance > maxDistance) {
    return null;
  }
  return distance;
}

function intersectAxis(
  origin: number,
  direction: number,
  min: number,
  max: number,
  currentMin: number,
  currentMax: number,
): { tMin: number; tMax: number } | null {
  if (Math.abs(direction) < 1e-8) {
    if (origin < min || origin > max) {
      return null;
    }
    return { tMin: currentMin, tMax: currentMax };
  }

  const inv = 1 / direction;
  let t1 = (min - origin) * inv;
  let t2 = (max - origin) * inv;
  if (t1 > t2) {
    const temp = t1;
    t1 = t2;
    t2 = temp;
  }

  const tMin = Math.max(currentMin, t1);
  const tMax = Math.min(currentMax, t2);
  if (tMin > tMax) {
    return null;
  }
  return { tMin, tMax };
}
