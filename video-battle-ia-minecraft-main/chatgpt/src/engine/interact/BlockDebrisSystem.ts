import { BoxGeometry, Group, Mesh, MeshStandardMaterial, Vector3, type Scene } from 'three';
import { BlockId } from '../world/BlockTypes';

type DebrisParticle = {
  mesh: Mesh;
  velocity: Vector3;
  life: number;
};

const GEOMETRY = new BoxGeometry(0.08, 0.08, 0.08);

function colorFor(block: BlockId): number {
  switch (block) {
    case BlockId.Grass:
      return 0x6fb55d;
    case BlockId.Dirt:
      return 0x815431;
    case BlockId.Stone:
      return 0x9ba1a8;
    case BlockId.Wood:
      return 0x9f6f35;
    case BlockId.Leaves:
      return 0x4f9148;
    case BlockId.CandyBlock:
      return 0xce73d3;
    case BlockId.PackedBrick:
      return 0x8f6b58;
    case BlockId.Glowshroom:
      return 0x5acbbb;
    default:
      return 0xb9b9b9;
  }
}

export class BlockDebrisSystem {
  private readonly root = new Group();
  private readonly particles: DebrisParticle[] = [];
  private readonly materialCache = new Map<number, MeshStandardMaterial>();

  constructor(scene: Scene) {
    this.root.name = 'block-debris';
    scene.add(this.root);
  }

  spawnBurst(x: number, y: number, z: number, block: BlockId): void {
    const color = colorFor(block);
    const material = this.getMaterial(color);
    for (let i = 0; i < 8; i += 1) {
      const mesh = new Mesh(GEOMETRY, material);
      mesh.position.set(x + (Math.random() - 0.5) * 0.35, y + 0.3 + Math.random() * 0.25, z + (Math.random() - 0.5) * 0.35);
      this.root.add(mesh);
      this.particles.push({
        mesh,
        velocity: new Vector3((Math.random() - 0.5) * 2.6, 1.8 + Math.random() * 1.2, (Math.random() - 0.5) * 2.6),
        life: 0.6 + Math.random() * 0.3,
      });
    }
  }

  update(dt: number): void {
    for (let i = this.particles.length - 1; i >= 0; i -= 1) {
      const particle = this.particles[i];
      particle.life -= dt;
      particle.velocity.y -= 9.8 * dt;
      particle.mesh.position.addScaledVector(particle.velocity, dt);
      particle.mesh.rotation.x += dt * 3.2;
      particle.mesh.rotation.y += dt * 3.8;
      if (particle.life <= 0) {
        this.root.remove(particle.mesh);
        this.particles.splice(i, 1);
      }
    }
  }

  private getMaterial(color: number): MeshStandardMaterial {
    const cached = this.materialCache.get(color);
    if (cached) {
      return cached;
    }
    const material = new MeshStandardMaterial({ color, roughness: 0.72, metalness: 0.04 });
    this.materialCache.set(color, material);
    return material;
  }
}
