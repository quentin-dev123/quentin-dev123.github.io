import { PerspectiveCamera, Vector3 } from 'three';
import { SfxSystem } from '../audio/SfxSystem';
import { InventorySystem } from '../inventory/InventorySystem';
import { ItemId } from '../inventory/InventoryTypes';
import { DroppedItemSystem } from '../items/DroppedItemSystem';
import { ChunkManager } from '../world/ChunkManager';
import { BlockId, getBlockHardnessSeconds, isBreakableBlock } from '../world/BlockTypes';
import { PLAYER_HALF_WIDTH, PLAYER_HEIGHT } from '../world/constants';

export type VoxelHit = {
  hit: { x: number; y: number; z: number };
  previous: { x: number; y: number; z: number };
};

export type MiningVisualState = {
  hit: { x: number; y: number; z: number };
  previous: { x: number; y: number; z: number };
  progress: number;
};

export class BlockInteractor {
  private readonly chunkManager: ChunkManager;
  private readonly camera: PerspectiveCamera;
  private readonly getPlayerFeet: () => Vector3;
  private readonly domElement: HTMLElement;
  private readonly inventory: InventorySystem;
  private readonly droppedItems: DroppedItemSystem;
  private readonly sfx: SfxSystem;
  private readonly canInteract: () => boolean;
  private readonly onPrimaryAttack: ((origin: Vector3, direction: Vector3) => boolean) | null;
  private readonly onBlockBroken: ((x: number, y: number, z: number, block: BlockId) => void) | null;
  private readonly onConsumableUsed: ((label: string, speedBoostSeconds: number) => void) | null;
  private readonly rayOrigin = new Vector3();
  private readonly rayDir = new Vector3();
  private readonly miningVisualState: MiningVisualState = {
    hit: { x: 0, y: 0, z: 0 },
    previous: { x: 0, y: 0, z: 0 },
    progress: 0,
  };
  private leftMouseDown = false;
  private miningProgress = 0;
  private miningTargetBlockId: BlockId = BlockId.Air;
  private hasMiningTarget = false;
  private miningTargetX = 0;
  private miningTargetY = 0;
  private miningTargetZ = 0;
  private miningPrevX = 0;
  private miningPrevY = 0;
  private miningPrevZ = 0;
  private lastMiningAudioStage = -1;

  constructor(
    chunkManager: ChunkManager,
    camera: PerspectiveCamera,
    getPlayerFeet: () => Vector3,
    domElement: HTMLElement,
    inventory: InventorySystem,
    droppedItems: DroppedItemSystem,
    sfx: SfxSystem,
    canInteract: () => boolean,
    onPrimaryAttack?: (origin: Vector3, direction: Vector3) => boolean,
    onBlockBroken?: (x: number, y: number, z: number, block: BlockId) => void,
    onConsumableUsed?: (label: string, speedBoostSeconds: number) => void,
  ) {
    this.chunkManager = chunkManager;
    this.camera = camera;
    this.getPlayerFeet = getPlayerFeet;
    this.domElement = domElement;
    this.inventory = inventory;
    this.droppedItems = droppedItems;
    this.sfx = sfx;
    this.canInteract = canInteract;
    this.onPrimaryAttack = onPrimaryAttack ?? null;
    this.onBlockBroken = onBlockBroken ?? null;
    this.onConsumableUsed = onConsumableUsed ?? null;

    domElement.addEventListener('contextmenu', (event) => event.preventDefault());
    window.addEventListener('mousedown', (event) => {
      if (!this.canMineNow()) {
        return;
      }
      if (event.button === 0) {
        this.sfx.playAttackSwing();
        if (this.tryPrimaryAttack()) {
          this.sfx.playAttackHit();
          this.leftMouseDown = false;
          this.clearMiningTarget();
          return;
        }
        this.leftMouseDown = true;
      } else if (event.button === 2) {
        this.clearMiningTarget();
        this.addBlock();
      }
    });
    window.addEventListener('mouseup', (event) => {
      if (event.button !== 0) {
        return;
      }
      this.leftMouseDown = false;
      this.clearMiningTarget();
    });
    window.addEventListener('blur', () => {
      this.leftMouseDown = false;
      this.clearMiningTarget();
    });
    document.addEventListener('pointerlockchange', () => {
      if (document.pointerLockElement === this.domElement) {
        return;
      }
      this.leftMouseDown = false;
      this.clearMiningTarget();
    });
  }

  update(dt: number): void {
    if (!this.canMineNow()) {
      this.leftMouseDown = false;
      this.clearMiningTarget();
      return;
    }
    if (!this.leftMouseDown) {
      this.clearMiningTarget();
      return;
    }

    const hit = this.traceVoxel();
    if (!hit) {
      this.clearMiningTarget();
      return;
    }

    const targetBlock = this.chunkManager.getBlockAtWorld(hit.hit.x, hit.hit.y, hit.hit.z);
    if (targetBlock === BlockId.Air || !isBreakableBlock(targetBlock)) {
      this.clearMiningTarget();
      return;
    }

    const isSameTarget =
      this.hasMiningTarget &&
      this.miningTargetX === hit.hit.x &&
      this.miningTargetY === hit.hit.y &&
      this.miningTargetZ === hit.hit.z &&
      this.miningTargetBlockId === targetBlock;

    if (!isSameTarget) {
      this.miningProgress = 0;
      this.miningTargetBlockId = targetBlock;
      this.hasMiningTarget = true;
      this.miningTargetX = hit.hit.x;
      this.miningTargetY = hit.hit.y;
      this.miningTargetZ = hit.hit.z;
      this.lastMiningAudioStage = -1;
    }

    this.miningPrevX = hit.previous.x;
    this.miningPrevY = hit.previous.y;
    this.miningPrevZ = hit.previous.z;

    const hardness = Math.max(0.06, getBlockHardnessSeconds(targetBlock));
    const toolMultiplier = this.inventory.getSelectedMiningSpeedMultiplier(targetBlock);
    this.miningProgress = Math.min(1, this.miningProgress + (dt * toolMultiplier) / hardness);
    this.playMiningSfxStage(targetBlock);

    if (this.miningProgress >= 1) {
      this.removeTargetBlock();
      this.clearMiningTarget();
    }
  }

  getMiningVisualState(): MiningVisualState | null {
    if (!this.hasMiningTarget) {
      return null;
    }
    this.miningVisualState.hit.x = this.miningTargetX;
    this.miningVisualState.hit.y = this.miningTargetY;
    this.miningVisualState.hit.z = this.miningTargetZ;
    this.miningVisualState.previous.x = this.miningPrevX;
    this.miningVisualState.previous.y = this.miningPrevY;
    this.miningVisualState.previous.z = this.miningPrevZ;
    this.miningVisualState.progress = this.miningProgress;
    return this.miningVisualState;
  }

  isMining(): boolean {
    return this.hasMiningTarget;
  }

  private addBlock(): void {
    const hit = this.traceVoxel();
    if (!hit) {
      return;
    }
    if (!this.canPlaceAt(hit.previous.x, hit.previous.y, hit.previous.z)) {
      return;
    }
    if (this.chunkManager.getBlockAtWorld(hit.previous.x, hit.previous.y, hit.previous.z) !== BlockId.Air) {
      return;
    }
    const selectedBlock = this.inventory.getSelectedBlockId();
    if (selectedBlock === null || selectedBlock === BlockId.Air) {
      const consumed = this.inventory.useSelectedConsumable();
      if (consumed.consumed) {
        this.sfx.playPlayerEat(consumed.speedBoostSeconds > 0);
        this.onConsumableUsed?.(consumed.label, consumed.speedBoostSeconds);
      }
      return;
    }
    if (!this.inventory.consumeSelectedBlock(1)) {
      return;
    }
    this.chunkManager.setBlockAtWorld(hit.previous.x, hit.previous.y, hit.previous.z, selectedBlock);
    this.sfx.playBlockPlace(selectedBlock);
  }

  private removeTargetBlock(): void {
    if (!this.hasMiningTarget) {
      return;
    }
    const currentBlock = this.chunkManager.getBlockAtWorld(this.miningTargetX, this.miningTargetY, this.miningTargetZ);
    if (currentBlock === BlockId.Air || !isBreakableBlock(currentBlock)) {
      return;
    }
    this.chunkManager.setBlockAtWorld(this.miningTargetX, this.miningTargetY, this.miningTargetZ, BlockId.Air);
    this.sfx.playBlockBreak(currentBlock);
    this.spawnLootForBlock(currentBlock, this.miningTargetX, this.miningTargetY, this.miningTargetZ);
    this.onBlockBroken?.(this.miningTargetX, this.miningTargetY, this.miningTargetZ, currentBlock);
  }

  private clearMiningTarget(): void {
    this.hasMiningTarget = false;
    this.miningProgress = 0;
    this.miningTargetBlockId = BlockId.Air;
    this.lastMiningAudioStage = -1;
  }

  private playMiningSfxStage(block: BlockId): void {
    if (!this.hasMiningTarget) {
      return;
    }
    const stage = Math.min(3, Math.floor(this.miningProgress * 4));
    if (stage <= this.lastMiningAudioStage) {
      return;
    }
    this.lastMiningAudioStage = stage;
    this.sfx.playMiningTick(block);
  }

  private canMineNow(): boolean {
    if (!this.canInteract()) {
      return false;
    }
    return document.pointerLockElement === this.domElement;
  }

  private canPlaceAt(x: number, y: number, z: number): boolean {
    const player = this.getPlayerFeet();
    const pMinX = player.x - PLAYER_HALF_WIDTH;
    const pMaxX = player.x + PLAYER_HALF_WIDTH;
    const pMinY = player.y;
    const pMaxY = player.y + PLAYER_HEIGHT;
    const pMinZ = player.z - PLAYER_HALF_WIDTH;
    const pMaxZ = player.z + PLAYER_HALF_WIDTH;
    const bMinX = x;
    const bMaxX = x + 1;
    const bMinY = y;
    const bMaxY = y + 1;
    const bMinZ = z;
    const bMaxZ = z + 1;

    const overlap =
      pMinX < bMaxX &&
      pMaxX > bMinX &&
      pMinY < bMaxY &&
      pMaxY > bMinY &&
      pMinZ < bMaxZ &&
      pMaxZ > bMinZ;

    return !overlap;
  }

  private traceVoxel(maxDistance = 8, step = 0.1): VoxelHit | null {
    this.getViewRay(this.rayOrigin, this.rayDir);

    let prevX = Math.floor(this.rayOrigin.x);
    let prevY = Math.floor(this.rayOrigin.y);
    let prevZ = Math.floor(this.rayOrigin.z);

    for (let t = 0; t <= maxDistance; t += step) {
      const px = this.rayOrigin.x + this.rayDir.x * t;
      const py = this.rayOrigin.y + this.rayDir.y * t;
      const pz = this.rayOrigin.z + this.rayDir.z * t;
      const vx = Math.floor(px);
      const vy = Math.floor(py);
      const vz = Math.floor(pz);

      if (vx === prevX && vy === prevY && vz === prevZ) {
        continue;
      }

      const block = this.chunkManager.getBlockAtWorld(vx, vy, vz);
      if (block !== BlockId.Air) {
        return {
          hit: { x: vx, y: vy, z: vz },
          previous: { x: prevX, y: prevY, z: prevZ },
        };
      }

      prevX = vx;
      prevY = vy;
      prevZ = vz;
    }

    return null;
  }

  private tryPrimaryAttack(): boolean {
    if (!this.onPrimaryAttack) {
      return false;
    }
    this.getViewRay(this.rayOrigin, this.rayDir);
    return this.onPrimaryAttack(this.rayOrigin, this.rayDir);
  }

  private getViewRay(origin: Vector3, direction: Vector3): void {
    this.camera.getWorldPosition(origin);
    this.camera.getWorldDirection(direction);
    direction.normalize();
  }

  private spawnLootForBlock(block: BlockId, x: number, y: number, z: number): void {
    const spawnX = x + 0.5;
    const spawnY = y + 0.55;
    const spawnZ = z + 0.5;
    if (block === BlockId.Leaves) {
      const roll = Math.random();
      if (roll < 0.22) {
        this.droppedItems.spawnDropItem(ItemId.Apple, spawnX, spawnY, spawnZ);
        return;
      }
      if (roll < 0.4) {
        this.droppedItems.spawnDropItem(ItemId.Wheat, spawnX, spawnY, spawnZ);
        return;
      }
      return;
    }
    if (block === BlockId.TallGrass) {
      this.droppedItems.spawnDropItem(ItemId.Wheat, spawnX, spawnY, spawnZ);
      return;
    }
    if (block === BlockId.Gravel && Math.random() < 0.38) {
      this.droppedItems.spawnDropItem(ItemId.Flint, spawnX, spawnY, spawnZ);
      return;
    }
    this.droppedItems.spawnDrop(block, spawnX, spawnY, spawnZ);
  }
}
