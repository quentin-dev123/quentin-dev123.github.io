import { BoxGeometry, Group, Mesh, MeshStandardMaterial, PerspectiveCamera } from 'three';
import { BlockId } from '../world/BlockTypes';

const REST_POS_X = 0.36;
const REST_POS_Y = -0.3;
const REST_POS_Z = -0.54;
const REST_ROT_X = 0.08;
const REST_ROT_Y = -0.22;
const REST_ROT_Z = 0.14;

export class FirstPersonHand {
  private readonly group = new Group();
  private readonly heldMesh: Mesh;
  private readonly heldToolMesh: Mesh;
  private swingTime = 0;
  private targetPosX = REST_POS_X;
  private targetPosY = REST_POS_Y;
  private targetPosZ = REST_POS_Z;
  private targetRotX = REST_ROT_X;
  private targetRotY = REST_ROT_Y;
  private targetRotZ = REST_ROT_Z;

  constructor(camera: PerspectiveCamera) {
    const skinMaterial = new MeshStandardMaterial({
      color: '#d4a077',
      roughness: 0.92,
      metalness: 0.02,
      flatShading: true,
    });
    const sleeveMaterial = new MeshStandardMaterial({
      color: '#355a72',
      roughness: 0.95,
      metalness: 0,
      flatShading: true,
    });

    const palm = new Mesh(new BoxGeometry(0.2, 0.18, 0.28), skinMaterial);
    palm.position.set(0, -0.02, 0.03);

    const wrist = new Mesh(new BoxGeometry(0.16, 0.16, 0.16), skinMaterial);
    wrist.position.set(0, -0.06, -0.16);

    const sleeve = new Mesh(new BoxGeometry(0.22, 0.2, 0.24), sleeveMaterial);
    sleeve.position.set(0, -0.04, -0.36);

    const thumb = new Mesh(new BoxGeometry(0.06, 0.09, 0.11), skinMaterial);
    const heldMaterial = new MeshStandardMaterial({
      color: '#9aa0a8',
      roughness: 0.72,
      metalness: 0.1,
      flatShading: true,
    });
    this.heldMesh = new Mesh(new BoxGeometry(0.16, 0.16, 0.16), heldMaterial);
    this.heldMesh.position.set(-0.08, 0.06, 0.2);
    this.heldMesh.visible = false;

    this.heldToolMesh = new Mesh(
      new BoxGeometry(0.07, 0.3, 0.07),
      new MeshStandardMaterial({ color: '#9a7248', roughness: 0.88, metalness: 0.02, flatShading: true }),
    );
    this.heldToolMesh.position.set(-0.08, -0.02, 0.22);
    this.heldToolMesh.visible = false;

    thumb.position.set(0.09, -0.03, 0.08);
    thumb.rotation.set(0.25, 0.1, -0.35);

    palm.castShadow = false;
    wrist.castShadow = false;
    sleeve.castShadow = false;
    thumb.castShadow = false;
    palm.receiveShadow = false;
    wrist.receiveShadow = false;
    sleeve.receiveShadow = false;
    thumb.receiveShadow = false;

    this.group.add(sleeve, wrist, palm, thumb, this.heldMesh, this.heldToolMesh);
    this.group.position.set(REST_POS_X, REST_POS_Y, REST_POS_Z);
    this.group.rotation.set(REST_ROT_X, REST_ROT_Y, REST_ROT_Z);

    camera.add(this.group);
  }

  update(dt: number, isMining: boolean, miningProgress: number): void {
    if (isMining) {
      this.swingTime += dt * 13;
      const swing = Math.sin(this.swingTime) * 0.5 + 0.5;
      const force = 0.45 + Math.min(1, miningProgress) * 0.55;

      this.targetPosX = REST_POS_X + 0.01 * swing;
      this.targetPosY = REST_POS_Y - 0.05 * swing * force;
      this.targetPosZ = REST_POS_Z + 0.04 * swing * force;

      this.targetRotX = REST_ROT_X - 0.7 * swing * force;
      this.targetRotY = REST_ROT_Y + 0.28 * swing * force;
      this.targetRotZ = REST_ROT_Z - 0.18 * swing * force;
    } else {
      this.swingTime = 0;
      this.targetPosX = REST_POS_X;
      this.targetPosY = REST_POS_Y;
      this.targetPosZ = REST_POS_Z;
      this.targetRotX = REST_ROT_X;
      this.targetRotY = REST_ROT_Y;
      this.targetRotZ = REST_ROT_Z;
    }

    const blend = Math.min(1, dt * 18);
    this.group.position.x += (this.targetPosX - this.group.position.x) * blend;
    this.group.position.y += (this.targetPosY - this.group.position.y) * blend;
    this.group.position.z += (this.targetPosZ - this.group.position.z) * blend;
    this.group.rotation.x += (this.targetRotX - this.group.rotation.x) * blend;
    this.group.rotation.y += (this.targetRotY - this.group.rotation.y) * blend;
    this.group.rotation.z += (this.targetRotZ - this.group.rotation.z) * blend;
  }

  setHeldItem(blockId: BlockId | null, isTool: boolean): void {
    this.heldToolMesh.visible = isTool;
    if (isTool) {
      this.heldMesh.visible = false;
      return;
    }
    if (blockId === null || blockId === BlockId.Air) {
      this.heldMesh.visible = false;
      return;
    }
    this.heldMesh.visible = true;
    const material = this.heldMesh.material as MeshStandardMaterial;
    material.color.setHex(this.getBlockColor(blockId));
  }

  private getBlockColor(blockId: BlockId): number {
    switch (blockId) {
      case BlockId.Grass:
        return 0x6eb95e;
      case BlockId.Dirt:
        return 0x875733;
      case BlockId.Stone:
        return 0x9ba1a8;
      case BlockId.Wood:
        return 0x9f6f35;
      case BlockId.Leaves:
        return 0x4f9049;
      case BlockId.CandyBlock:
        return 0xcc73d1;
      case BlockId.PackedBrick:
        return 0x8f6b58;
      case BlockId.Glowshroom:
        return 0x5acbbb;
      default:
        return 0xb7b7b7;
    }
  }
}
