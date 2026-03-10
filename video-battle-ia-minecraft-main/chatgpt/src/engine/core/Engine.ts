import { SfxSystem } from '../audio/SfxSystem';
import { CraftingSystem } from '../crafting/CraftingSystem';
import { EventBus } from '../events/EventBus';
import { BlockDebrisSystem } from '../interact/BlockDebrisSystem';
import { BlockBreakOverlay } from '../interact/BlockBreakOverlay';
import { BlockInteractor } from '../interact/BlockInteractor';
import { InventorySystem } from '../inventory/InventorySystem';
import { ItemId, createBlockItemId, getItemDefinition, tryGetBlockIdFromItem } from '../inventory/InventoryTypes';
import { DroppedItemSystem } from '../items/DroppedItemSystem';
import { DayNightCycle } from '../lighting/DayNightCycle';
import { PigSystem } from '../mobs/PigSystem';
import { NpcInteractor } from '../npc/NpcInteractor';
import { NpcSystem } from '../npc/NpcSystem';
import { FirstPersonHand } from '../player/FirstPersonHand';
import { PlayerController } from '../player/PlayerController';
import { VoxelPhysics } from '../physics/VoxelPhysics';
import { Renderer } from '../render/Renderer';
import { TradeSystem } from '../social/TradeSystem';
import { TextureGenerator } from '../textures/TextureGenerator';
import { DialogueUi } from '../ui/DialogueUi';
import { GameState } from '../ui/GameState';
import { HudUi } from '../ui/HudUi';
import { TradingUi } from '../ui/TradingUi';
import { BlockId } from '../world/BlockTypes';
import { ChunkManager } from '../world/ChunkManager';

export class Engine {
  private readonly renderer: Renderer;
  private readonly textures: TextureGenerator;
  private readonly chunkManager: ChunkManager;
  private readonly physics: VoxelPhysics;
  private readonly player: PlayerController;
  private readonly dayNight: DayNightCycle;
  private readonly sfx: SfxSystem;
  private readonly gameState: GameState;
  private readonly inventory: InventorySystem;
  private readonly droppedItems: DroppedItemSystem;
  private readonly pigSystem: PigSystem;
  private readonly blockInteractor: BlockInteractor;
  private readonly blockBreakOverlay: BlockBreakOverlay;
  private readonly firstPersonHand: FirstPersonHand;
  private readonly crafting: CraftingSystem;
  private readonly eventBus: EventBus;
  private readonly npcSystem: NpcSystem;
  private readonly npcInteractor: NpcInteractor;
  private readonly tradeSystem: TradeSystem;
  private readonly dialogueUi: DialogueUi;
  private readonly tradingUi: TradingUi;
  private readonly debris: BlockDebrisSystem;
  private readonly hud: HudUi;
  private readonly options = {
    fov: 75,
    sensitivity: 0.0023,
    renderDistance: 3,
  };
  private running = false;
  private speedBoostRemaining = 0;
  private lastPhase: 'day' | 'dusk' | 'night' = 'day';

  constructor(container: HTMLElement) {
    this.renderer = new Renderer(container);
    this.textures = new TextureGenerator();
    this.chunkManager = new ChunkManager(this.renderer.scene, this.textures, {
      seed: this.createSessionSeed(),
      renderRadius: this.options.renderDistance,
    });
    this.chunkManager.initialize(0, 0);

    this.physics = new VoxelPhysics(this.chunkManager.getBlockAtWorld.bind(this.chunkManager));
    this.player = new PlayerController(this.renderer.camera);
    this.inventory = new InventorySystem();
    this.gameState = new GameState(this.renderer.renderer.domElement);
    this.sfx = new SfxSystem(this.renderer.renderer.domElement);
    this.crafting = new CraftingSystem(this.inventory);
    this.eventBus = new EventBus();
    this.droppedItems = new DroppedItemSystem(
      this.renderer.scene,
      this.chunkManager.getBlockAtWorld.bind(this.chunkManager),
    );
    this.pigSystem = new PigSystem(
      this.renderer.scene,
      this.chunkManager.getBlockAtWorld.bind(this.chunkManager),
      this.chunkManager.getSurfaceY.bind(this.chunkManager),
    );
    const spawnX = 8;
    const spawnZ = 8;
    const surfaceY = this.chunkManager.getSurfaceY(spawnX, spawnZ);
    this.player.position.set(spawnX + 0.5, surfaceY + 2, spawnZ + 0.5);
    this.pigSystem.spawnAround(this.player.position);
    this.player.bindInput(
      this.renderer.renderer.domElement,
      this.gameState,
      () => this.gameState.toggleInventory(),
      () => this.gameState.handleEscape(),
      (index) => this.inventory.setSelectedHotbarIndex(index),
      (delta) => this.inventory.cycleSelectedHotbar(delta),
    );
    this.dayNight = new DayNightCycle(this.renderer);
    this.blockBreakOverlay = new BlockBreakOverlay(this.renderer.scene, this.textures);
    this.firstPersonHand = new FirstPersonHand(this.renderer.camera);
    this.debris = new BlockDebrisSystem(this.renderer.scene);
    this.tradeSystem = new TradeSystem(this.inventory);
    this.npcSystem = new NpcSystem(
      this.renderer.scene,
      this.chunkManager.getBlockAtWorld.bind(this.chunkManager),
      this.chunkManager.getSurfaceY.bind(this.chunkManager),
      this.eventBus,
    );

    this.hud = new HudUi(
      this.inventory,
      this.gameState,
      {
        onResume: () => this.gameState.resumeGameplay(),
        onOpenOptions: () => this.gameState.openOptions(),
        onBackToPause: () => this.gameState.closeOptionsToPause(),
        onSetFov: (value) => this.renderer.setFov(value),
        onSetSensitivity: (value) => this.player.setSensitivity(value),
        onSetRenderDistance: (value) => {
          this.chunkManager.setRenderRadius(value);
        },
        onCraftRecipe: (recipeId) => {
          const result = this.crafting.craft(recipeId);
          this.hud.showToast(result.message);
        },
      },
      this.options,
    );
    this.dialogueUi = new DialogueUi(this.hud);
    this.tradingUi = new TradingUi(this.hud, this.tradeSystem);

    this.blockInteractor = new BlockInteractor(
      this.chunkManager,
      this.renderer.camera,
      () => this.player.position,
      this.renderer.renderer.domElement,
      this.inventory,
      this.droppedItems,
      this.sfx,
      () => this.gameState.isGameplayActive(),
      (origin, direction) => this.pigSystem.tryHitFromRay(origin, direction),
      (x, y, z, block) => this.debris.spawnBurst(x + 0.5, y + 0.2, z + 0.5, block),
      (label, speedBoostSeconds) => {
        this.hud.showToast(`${label} consomme`);
        this.speedBoostRemaining = Math.max(this.speedBoostRemaining, speedBoostSeconds);
      },
    );
    this.npcInteractor = new NpcInteractor(
      this.renderer.camera,
      this.npcSystem,
      () => this.player.position,
      () => this.gameState.isGameplayActive(),
      (npc) => {
        this.gameState.openDialogue();
        this.dialogueUi.open(
          npc,
          () => {
            this.gameState.openTrading();
            this.tradingUi.open(
              npc,
              () => this.gameState.resumeGameplay(),
              (message) => this.hud.showToast(message),
            );
          },
          () => this.gameState.resumeGameplay(),
        );
      },
    );
    this.addStarterItems();
  }

  start(): void {
    if (this.running) {
      return;
    }
    this.running = true;
    this.loop();
  }

  private loop = (): void => {
    if (!this.running) {
      return;
    }
    const dt = Math.min(this.renderer.clock.getDelta(), 0.05);

    if (this.gameState.isGameplayActive()) {
      this.player.update(dt, this.physics);
      this.dayNight.update(dt);
      const phase = this.dayNight.getPhase();
      if (phase !== this.lastPhase) {
        this.lastPhase = phase;
        this.eventBus.emit('timePhaseChanged', { phase });
      }
      this.eventBus.emit('daylightChanged', { daylight: this.dayNight.getDaylight() });
      const vitalsTick = this.inventory.tickVitals(dt);
      if (vitalsTick.died) {
        this.hud.showToast('Tu t es evanoui, soin d urgence + faim restoree');
        this.inventory.heal(8);
        this.inventory.addItemById(ItemId.Apple, 2);
      }
      if (this.speedBoostRemaining > 0) {
        this.speedBoostRemaining = Math.max(0, this.speedBoostRemaining - dt);
      }
      this.player.setSpeedMultiplier(this.speedBoostRemaining > 0 ? 1.32 : 1);
      this.droppedItems.update(dt, this.player.position, (itemId, count) => {
        const accepted = this.inventory.addItemById(itemId, count);
        if (accepted) {
          this.sfx.playItemPickup();
          this.hud.showToast(`+${count} ${itemId}`);
        }
        return accepted;
      });
      this.pigSystem.update(dt, this.player.position, true, (damage) => {
        const previousHealth = this.inventory.getVitals().health;
        this.inventory.applyDamage(damage);
        const currentHealth = this.inventory.getVitals().health;
        if (currentHealth < previousHealth) {
          this.sfx.playPlayerHurt();
          this.hud.flashDamage();
        }
      }, (position) => {
        this.droppedItems.spawnDropItem(ItemId.RawPork, position.x, position.y + 0.5, position.z, 1 + Math.floor(Math.random() * 2));
        this.droppedItems.spawnDropItem(ItemId.Coin, position.x + 0.2, position.y + 0.55, position.z - 0.2, 1);
      });
      this.npcSystem.update(dt);
      const focusedNpc = this.npcInteractor.update();
      this.hud.setInteractionHint(focusedNpc ? `F - Parler avec ${focusedNpc.displayName}` : null);
      if (this.dayNight.getPhase() === 'night') {
        this.pigSystem.spawnAround(this.player.position, 10);
      }
    } else {
      this.player.update(0, this.physics);
      this.pigSystem.update(0, this.player.position, false, () => undefined);
      this.npcSystem.update(0);
      this.hud.setInteractionHint(null);
    }
    this.chunkManager.update(this.player.position.x, this.player.position.z, dt);
    this.chunkManager.rebuildDirtyChunks();
    this.blockInteractor.update(dt);
    const selected = this.inventory.getSelectedItemStack();
    const selectedDef = selected ? getItemDefinition(selected.itemId) : null;
    this.firstPersonHand.setHeldItem(
      selected ? tryGetBlockIdFromItem(selected.itemId) : null,
      selectedDef?.kind === 'tool',
    );

    const miningVisualState = this.blockInteractor.getMiningVisualState();
    if (miningVisualState) {
      this.blockBreakOverlay.setBreakState(miningVisualState, miningVisualState.progress);
      this.firstPersonHand.update(dt, true, miningVisualState.progress);
      this.hud.setCrosshairMining(true);
    } else {
      this.blockBreakOverlay.hide();
      this.firstPersonHand.update(dt, false, 0);
      this.hud.setCrosshairMining(false);
    }
    this.debris.update(dt);

    this.renderer.renderFrame();
    requestAnimationFrame(this.loop);
  };

  private createSessionSeed(): string {
    const randomPart = Math.random().toString(36).slice(2, 10);
    return `seed-${Date.now().toString(36)}-${randomPart}`;
  }

  private addStarterItems(): void {
    this.inventory.addItemById(createBlockItemId(BlockId.Grass), 24);
    this.inventory.addItemById(createBlockItemId(BlockId.Wood), 16);
    this.inventory.addItemById(createBlockItemId(BlockId.Stone), 18);
    this.inventory.addItemById(createBlockItemId(BlockId.Glowshroom), 8);
    this.inventory.addItemById(createBlockItemId(BlockId.CandyBlock), 8);
    this.inventory.addItemById(ItemId.WoodenPickaxe, 1);
    this.inventory.addItemById(ItemId.Apple, 6);
    this.inventory.addItemById(ItemId.Coin, 6);
    this.npcSystem.spawnNear(this.player.position);
  }
}
