import { Group, Vector3, type Scene } from 'three';
import { EventBus } from '../events/EventBus';
import { BlockId, isSolidBlock, isWaterBlock } from '../world/BlockTypes';
import { createNpcModel } from './NpcModel';
import { type NpcEntity } from './NpcTypes';

type WorldBlockGetter = (x: number, y: number, z: number) => BlockId;
type SurfaceGetter = (x: number, z: number) => number;

type NpcRender = {
  npc: NpcEntity;
  mesh: Group;
};

export class NpcSystem {
  private readonly root = new Group();
  private readonly npcs: NpcRender[] = [];
  private readonly getBlockAtWorld: WorldBlockGetter;
  private readonly getSurfaceY: SurfaceGetter;
  private readonly eventBus: EventBus;
  private readonly temp = new Vector3();
  private now = 0;
  private nextId = 1;
  private worldPhase: 'day' | 'dusk' | 'night' = 'day';

  constructor(scene: Scene, getBlockAtWorld: WorldBlockGetter, getSurfaceY: SurfaceGetter, eventBus: EventBus) {
    this.getBlockAtWorld = getBlockAtWorld;
    this.getSurfaceY = getSurfaceY;
    this.eventBus = eventBus;
    this.root.name = 'npc-system';
    scene.add(this.root);
    this.eventBus.subscribe('timePhaseChanged', (payload) => {
      this.worldPhase = payload.phase;
    });
  }

  spawnNear(center: Vector3): void {
    if (this.npcs.length > 0) {
      return;
    }
    this.spawnNpc(center, 'merchant', 'Marchand itinérant', 'Salut! J echange de bonnes affaires.');
    this.spawnNpc(center, 'brewer', 'Brasseur sylvestre', 'Ma biere accelere les aventuriers.');
  }

  update(dt: number): void {
    this.now += dt;
    for (const entry of this.npcs) {
      const npc = entry.npc;
      npc.walkTimer -= dt;
      if (npc.walkTimer <= 0) {
        npc.walkTimer = 1.8 + Math.random() * 3;
        npc.state = this.worldPhase === 'night' ? 'idle' : 'wander';
        const angle = Math.random() * Math.PI * 2;
        npc.velocity.set(Math.cos(angle), 0, Math.sin(angle)).multiplyScalar(npc.state === 'idle' ? 0 : 0.9);
      }
      if (npc.state === 'wander') {
        const nextX = npc.position.x + npc.velocity.x * dt;
        const nextZ = npc.position.z + npc.velocity.z * dt;
        const surface = this.getSurfaceY(Math.floor(nextX), Math.floor(nextZ));
        const floor = this.getBlockAtWorld(Math.floor(nextX), surface, Math.floor(nextZ));
        if (isWaterBlock(floor) || !isSolidBlock(floor)) {
          npc.velocity.multiplyScalar(-1);
        } else {
          npc.position.x = nextX;
          npc.position.z = nextZ;
          npc.position.y = surface + 1;
        }
      }
      entry.mesh.position.copy(npc.position);
      if (npc.velocity.lengthSq() > 0.01) {
        entry.mesh.rotation.y = Math.atan2(npc.velocity.x, npc.velocity.z);
      }
    }
  }

  getClosestNpc(playerPosition: Vector3, maxDistance = 3.4): NpcEntity | null {
    let best: NpcEntity | null = null;
    let bestDist = maxDistance;
    for (const entry of this.npcs) {
      this.temp.copy(entry.npc.position).sub(playerPosition);
      this.temp.y = 0;
      const dist = this.temp.length();
      if (dist < bestDist) {
        bestDist = dist;
        best = entry.npc;
      }
    }
    return best;
  }

  private spawnNpc(center: Vector3, kind: 'merchant' | 'brewer', name: string, line: string): void {
    const angle = Math.random() * Math.PI * 2;
    const radius = 5 + Math.random() * 5;
    const x = center.x + Math.cos(angle) * radius;
    const z = center.z + Math.sin(angle) * radius;
    const surface = this.getSurfaceY(Math.floor(x), Math.floor(z));
    const npc: NpcEntity = {
      id: this.nextId++,
      position: new Vector3(x, surface + 1, z),
      velocity: new Vector3(),
      state: 'idle',
      profession: kind,
      displayName: name,
      talkLine: line,
      walkTimer: 0.6 + Math.random(),
    };
    const mesh = createNpcModel(kind);
    mesh.position.copy(npc.position);
    this.root.add(mesh);
    this.npcs.push({ npc, mesh });
  }
}
