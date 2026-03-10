import { BoxGeometry, Group, Mesh, MeshStandardMaterial, Vector3, type Scene } from 'three';
import { isSolidBlock, BlockId, type BlockId as BlockIdType } from '../world/BlockTypes';
import { ItemId, createBlockItemId, getItemDefinition, tryGetBlockIdFromItem } from '../inventory/InventoryTypes';

type WorldBlockGetter = (x: number, y: number, z: number) => BlockIdType;
type PickupHandler = (itemId: ItemId, count: number) => boolean;

type DroppedItem = {
  id: number;
  itemId: ItemId;
  count: number;
  position: Vector3;
  velocity: Vector3;
  mesh: Mesh;
  pickupCooldown: number;
};

const ITEM_HALF_SIZE = 0.16;
const ITEM_GEOMETRY = new BoxGeometry(1, 1, 1);

function getColorForBlock(blockId: BlockIdType): number {
  switch (blockId) {
    case BlockId.Grass:
      return 0x66b95a;
    case BlockId.Dirt:
      return 0x8c5a34;
    case BlockId.Stone:
      return 0x9aa0a7;
    case BlockId.Wood:
      return 0x9f6f35;
    case BlockId.Leaves:
      return 0x4c8c43;
    case BlockId.Sand:
      return 0xcab27d;
    case BlockId.Gravel:
      return 0x9b9996;
    case BlockId.Water:
    case BlockId.WaterFlow1:
    case BlockId.WaterFlow2:
    case BlockId.WaterFlow3:
    case BlockId.WaterFlow4:
    case BlockId.WaterFlow5:
    case BlockId.WaterFlow6:
    case BlockId.WaterFlow7:
      return 0x3f79c7;
    case BlockId.Snow:
      return 0xf0f5ff;
    case BlockId.TallGrass:
      return 0x5f9f43;
    case BlockId.FlowerRed:
      return 0xd94f4f;
    case BlockId.FlowerYellow:
      return 0xdfc44d;
    case BlockId.Mud:
      return 0x6a4c36;
    case BlockId.Clay:
      return 0xa39b93;
    case BlockId.Podzol:
      return 0x6b4f34;
    default:
      return 0xffffff;
  }
}

function getColorForItem(itemId: ItemId): number {
  const blockId = tryGetBlockIdFromItem(itemId);
  if (blockId !== null) {
    return getColorForBlock(blockId);
  }
  switch (itemId) {
    case ItemId.Apple:
      return 0xd25f54;
    case ItemId.RawPork:
      return 0xd3887a;
    case ItemId.WoodenPickaxe:
    case ItemId.WoodenAxe:
      return 0xa3733f;
    case ItemId.Coin:
      return 0xd2b84f;
    case ItemId.Flint:
      return 0x8f9099;
    case ItemId.Wheat:
      return 0xd8bf68;
    case ItemId.ForestBrew:
      return 0xe5a35a;
    default:
      return 0xffffff;
  }
}

export class DroppedItemSystem {
  private readonly scene: Scene;
  private readonly getBlockAtWorld: WorldBlockGetter;
  private readonly root = new Group();
  private readonly items: DroppedItem[] = [];
  private readonly materialCache = new Map<ItemId, MeshStandardMaterial>();
  private nextId = 1;
  private readonly temp = new Vector3();
  private readonly horizontalTemp = new Vector3();

  constructor(scene: Scene, getBlockAtWorld: WorldBlockGetter) {
    this.scene = scene;
    this.getBlockAtWorld = getBlockAtWorld;
    this.root.name = 'dropped-items';
    this.scene.add(this.root);
  }

  spawnDrop(blockId: BlockIdType, x: number, y: number, z: number, count = 1): void {
    if (blockId === BlockId.Air || count <= 0) {
      return;
    }
    this.spawnDropItem(createBlockItemId(blockId), x, y, z, count);
  }

  spawnDropItem(itemId: ItemId, x: number, y: number, z: number, count = 1): void {
    if (count <= 0) {
      return;
    }
    const material = this.getOrCreateMaterial(itemId);
    const mesh = new Mesh(ITEM_GEOMETRY, material);
    mesh.scale.setScalar(ITEM_HALF_SIZE * 2);
    mesh.castShadow = true;
    mesh.receiveShadow = true;

    const position = new Vector3(x, y, z);
    const velocity = new Vector3((Math.random() - 0.5) * 1.8, 3.2 + Math.random() * 0.8, (Math.random() - 0.5) * 1.8);
    mesh.position.copy(position);
    this.root.add(mesh);

    this.items.push({
      id: this.nextId++,
      itemId,
      count,
      position,
      velocity,
      mesh,
      pickupCooldown: 0.25,
    });
  }

  update(dt: number, playerPosition: Vector3, onPickup: PickupHandler): void {
    for (let i = this.items.length - 1; i >= 0; i -= 1) {
      const item = this.items[i];
      item.pickupCooldown = Math.max(0, item.pickupCooldown - dt);
      this.updatePhysics(item, dt);
      this.applyMagnet(item, playerPosition, dt);

      item.mesh.position.copy(item.position);
      item.mesh.rotation.y += dt * 1.8;

      const verticalDistance = Math.abs(item.position.y - playerPosition.y);
      this.horizontalTemp.set(item.position.x - playerPosition.x, 0, item.position.z - playerPosition.z);
      const horizontalDistance = this.horizontalTemp.length();
      if (horizontalDistance <= 1.35 && verticalDistance <= 2.2 && item.pickupCooldown <= 0) {
        const accepted = onPickup(item.itemId, item.count);
        if (accepted) {
          this.removeItem(i);
        }
      }
    }
  }

  private updatePhysics(item: DroppedItem, dt: number): void {
    item.velocity.y -= 18 * dt;
    item.velocity.y = Math.max(item.velocity.y, -20);

    item.position.x += item.velocity.x * dt;
    item.position.y += item.velocity.y * dt;
    item.position.z += item.velocity.z * dt;

    const belowY = Math.floor(item.position.y - ITEM_HALF_SIZE - 0.02);
    const belowX = Math.floor(item.position.x);
    const belowZ = Math.floor(item.position.z);
    if (isSolidBlock(this.getBlockAtWorld(belowX, belowY, belowZ))) {
      const topY = belowY + 1 + ITEM_HALF_SIZE;
      if (item.position.y < topY) {
        item.position.y = topY;
        item.velocity.y = 0;
        item.velocity.x *= 0.82;
        item.velocity.z *= 0.82;
      }
    }
  }

  private applyMagnet(item: DroppedItem, playerPosition: Vector3, dt: number): void {
    this.temp.copy(playerPosition).sub(item.position);
    const dist = this.temp.length();
    if (dist > 0.001 && dist < 2.35) {
      this.temp.normalize();
      const pull = dist < 1.2 ? 12 : 5.4;
      item.velocity.addScaledVector(this.temp, pull * dt);
    }
  }

  private removeItem(index: number): void {
    const [item] = this.items.splice(index, 1);
    this.root.remove(item.mesh);
  }

  private getOrCreateMaterial(itemId: ItemId): MeshStandardMaterial {
    const cached = this.materialCache.get(itemId);
    if (cached) {
      return cached;
    }
    const def = getItemDefinition(itemId);
    const roughness = def.kind === 'currency' ? 0.35 : 0.72;
    const metalness = def.kind === 'currency' ? 0.28 : 0.06;
    const material = new MeshStandardMaterial({
      color: getColorForItem(itemId),
      roughness,
      metalness,
    });
    this.materialCache.set(itemId, material);
    return material;
  }
}
