import { InventorySystem } from '../inventory/InventorySystem';
import {
  HOTBAR_SIZE,
  ItemId,
  MAIN_INVENTORY_SIZE,
  getItemDefinition,
  tryGetBlockIdFromItem,
  type InventorySlot,
} from '../inventory/InventoryTypes';
import { GameState } from './GameState';
import { BlockId } from '../world/BlockTypes';

type HudUiOptions = {
  fov: number;
  sensitivity: number;
  renderDistance: number;
};

type HudUiCallbacks = {
  onResume: () => void;
  onOpenOptions: () => void;
  onBackToPause: () => void;
  onSetFov: (value: number) => void;
  onSetSensitivity: (value: number) => void;
  onSetRenderDistance: (value: number) => void;
  onCraftRecipe: (recipeId: string) => void;
};

const BLOCK_BASE_COLORS: Record<number, { base: string; dark: string; light: string }> = {
  [BlockId.Grass]: { base: '#75b64f', dark: '#4f8732', light: '#95d66b' },
  [BlockId.Dirt]: { base: '#7b5435', dark: '#5f3f27', light: '#976746' },
  [BlockId.Stone]: { base: '#8c9398', dark: '#6f777e', light: '#aab0b6' },
  [BlockId.Wood]: { base: '#8d6238', dark: '#6f4b2b', light: '#a87a49' },
  [BlockId.Leaves]: { base: '#4f9248', dark: '#3a6f35', light: '#6fb163' },
  [BlockId.Sand]: { base: '#ccb47e', dark: '#b29b67', light: '#e0cc96' },
  [BlockId.Gravel]: { base: '#9c9a96', dark: '#82807c', light: '#b9b5af' },
  [BlockId.Water]: { base: '#3f79c7', dark: '#2a5a9b', light: '#5f99e4' },
  [BlockId.Snow]: { base: '#f3f7ff', dark: '#d8dfe8', light: '#ffffff' },
  [BlockId.TallGrass]: { base: '#65a84a', dark: '#4a7f36', light: '#84c661' },
  [BlockId.FlowerRed]: { base: '#d84b4b', dark: '#ac2f2f', light: '#f57070' },
  [BlockId.FlowerYellow]: { base: '#dfc34a', dark: '#af9530', light: '#ffe17a' },
  [BlockId.Mud]: { base: '#6a4c36', dark: '#503828', light: '#7d5b43' },
  [BlockId.Clay]: { base: '#a39b93', dark: '#847d75', light: '#bdb6af' },
  [BlockId.Podzol]: { base: '#6b4f34', dark: '#523b27', light: '#87684b' },
  [BlockId.Glowshroom]: { base: '#59c8b8', dark: '#2f7f76', light: '#a0fff3' },
  [BlockId.CandyBlock]: { base: '#c56cc9', dark: '#97479b', light: '#f4a2ff' },
  [BlockId.PackedBrick]: { base: '#8d6b58', dark: '#674b3d', light: '#aa846f' },
};

export class HudUi {
  private readonly inventory: InventorySystem;
  private readonly gameState: GameState;
  private readonly callbacks: HudUiCallbacks;
  private readonly options: HudUiOptions;

  private readonly crosshair: HTMLElement;
  private readonly statusBars: HTMLElement;
  private readonly hotbar: HTMLElement;
  private readonly inventoryOverlay: HTMLElement;
  private readonly pauseOverlay: HTMLElement;
  private readonly optionsOverlay: HTMLElement;
  private readonly dialogueOverlay: HTMLElement;
  private readonly tradingOverlay: HTMLElement;
  private readonly dragPreview: HTMLElement;
  private readonly notifications: HTMLElement;
  private readonly interactionHint: HTMLElement;
  private readonly damageFlash: HTMLElement;
  private readonly blockIconUrls = new Map<number, string>();
  private readonly itemIconUrls = new Map<string, string>();

  private mouseX = 0;
  private mouseY = 0;

  constructor(inventory: InventorySystem, gameState: GameState, callbacks: HudUiCallbacks, options: HudUiOptions) {
    this.inventory = inventory;
    this.gameState = gameState;
    this.callbacks = callbacks;
    this.options = options;

    this.crosshair = this.mustGetById('crosshair');
    this.statusBars = this.mustGetById('status-bars');
    this.hotbar = this.mustGetById('hotbar');
    this.inventoryOverlay = this.mustGetById('inventory-overlay');
    this.pauseOverlay = this.mustGetById('pause-overlay');
    this.optionsOverlay = this.mustGetById('options-overlay');
    this.dialogueOverlay = this.mustGetById('dialogue-overlay');
    this.tradingOverlay = this.mustGetById('trading-overlay');
    this.notifications = this.mustGetById('hud-notifications');
    this.interactionHint = this.mustGetById('interaction-hint');
    this.damageFlash = this.mustGetById('damage-flash');
    this.dragPreview = document.createElement('div');
    this.dragPreview.className = 'drag-preview hidden';
    document.body.appendChild(this.dragPreview);
    this.initializeBlockIcons();

    window.addEventListener('mousemove', (event) => {
      this.mouseX = event.clientX;
      this.mouseY = event.clientY;
      this.dragPreview.style.transform = `translate(${this.mouseX}px, ${this.mouseY}px)`;
    });

    this.inventory.subscribe(() => this.render());
    this.gameState.subscribe(() => this.render());
    this.render();
  }

  private render(): void {
    this.renderStatusBars();
    this.renderHotbar();
    this.renderInventoryOverlay();
    this.renderPauseOverlay();
    this.renderOptionsOverlay();
    this.renderGlobalVisibility();
    this.renderDragPreview();
  }

  private renderGlobalVisibility(): void {
    const screen = this.gameState.getScreen();
    const showCrosshair = screen === 'gameplay';
    this.crosshair.classList.toggle('hidden', !showCrosshair);
    this.statusBars.classList.toggle('hidden', screen === 'options' || screen === 'dialogue' || screen === 'trading');
    this.hotbar.classList.toggle('hidden', screen === 'options' || screen === 'dialogue' || screen === 'trading');
    this.inventoryOverlay.classList.toggle('hidden', screen !== 'inventory');
    this.pauseOverlay.classList.toggle('hidden', screen !== 'pause');
    this.optionsOverlay.classList.toggle('hidden', screen !== 'options');
    this.dialogueOverlay.classList.toggle('hidden', screen !== 'dialogue');
    this.tradingOverlay.classList.toggle('hidden', screen !== 'trading');
  }

  private renderStatusBars(): void {
    const vitals = this.inventory.getVitals();
    const healthCells = this.createBarCells(vitals.health, 'heart');
    const hungerCells = this.createBarCells(vitals.hunger, 'hunger');
    this.statusBars.innerHTML = `
      <div class="bar-track">${healthCells}</div>
      <div class="bar-track">${hungerCells}</div>
    `;
  }

  private renderHotbar(): void {
    const slots = this.inventory.getSlotsSnapshot();
    const selected = this.inventory.getSelectedHotbarIndex();
    let html = '';
    for (let i = 0; i < HOTBAR_SIZE; i += 1) {
      html += this.getHotbarSlotHtml(slots[i], i, i === selected);
    }
    this.hotbar.innerHTML = html;
  }

  private renderInventoryOverlay(): void {
    if (this.gameState.getScreen() !== 'inventory') {
      return;
    }
    const slots = this.inventory.getSlotsSnapshot();
    const selectedHotbar = this.inventory.getSelectedHotbarIndex();
    const mainStart = HOTBAR_SIZE;

    let mainGridHtml = '';
    for (let i = 0; i < MAIN_INVENTORY_SIZE; i += 1) {
      const slotIndex = mainStart + i;
      mainGridHtml += this.getInventorySlotHtml(slotIndex, slots[slotIndex], false);
    }

    let hotbarGridHtml = '';
    for (let i = 0; i < HOTBAR_SIZE; i += 1) {
      hotbarGridHtml += this.getInventorySlotHtml(i, slots[i], i === selectedHotbar);
    }

    this.inventoryOverlay.innerHTML = `
      <div class="panel">
        <div class="panel-title">Inventaire</div>
        <div class="inventory-grid">${mainGridHtml}</div>
        <div class="inventory-separator">Barre rapide</div>
        <div class="inventory-grid">${hotbarGridHtml}</div>
        <div class="crafting-row">
          <button class="menu-button craft-button" data-craft="tool_pickaxe">Crafter Pioche</button>
          <button class="menu-button craft-button" data-craft="food_brew">Brasser Biere de foret</button>
          <button class="menu-button craft-button" data-craft="block_candy">Crafter CandyBlock</button>
        </div>
      </div>
    `;

    this.bindInventorySlotEvents();
    this.bindCraftEvents();
    this.inventoryOverlay.addEventListener('contextmenu', (event) => event.preventDefault(), { once: true });
  }

  private renderPauseOverlay(): void {
    if (this.gameState.getScreen() !== 'pause') {
      return;
    }
    this.pauseOverlay.innerHTML = `
      <div class="panel">
        <div class="panel-title">Menu Jeu</div>
        <div class="menu-buttons">
          <button class="menu-button" data-action="resume">Reprendre la partie</button>
          <button class="menu-button" data-action="options">Options...</button>
        </div>
      </div>
    `;
    this.pauseOverlay.querySelector<HTMLButtonElement>('button[data-action="resume"]')?.addEventListener('click', () => {
      this.callbacks.onResume();
    });
    this.pauseOverlay
      .querySelector<HTMLButtonElement>('button[data-action="options"]')
      ?.addEventListener('click', () => {
        this.callbacks.onOpenOptions();
      });
  }

  private renderOptionsOverlay(): void {
    if (this.gameState.getScreen() !== 'options') {
      return;
    }
    this.optionsOverlay.innerHTML = `
      <div class="panel">
        <div class="panel-title">Options</div>
        <div class="options-row">
          <label for="opt-fov">FOV</label>
          <input id="opt-fov" type="range" min="60" max="110" value="${Math.round(this.options.fov)}" />
        </div>
        <div class="options-row">
          <label for="opt-sens">Sensibilite</label>
          <input id="opt-sens" type="range" min="10" max="400" value="${Math.round(this.options.sensitivity * 100000)}" />
        </div>
        <div class="options-row">
          <label for="opt-rd">Distance de rendu</label>
          <input id="opt-rd" type="range" min="2" max="8" value="${Math.round(this.options.renderDistance)}" />
        </div>
        <div class="menu-buttons">
          <button class="menu-button" data-action="back">Retour</button>
        </div>
      </div>
    `;
    this.optionsOverlay.querySelector<HTMLInputElement>('#opt-fov')?.addEventListener('input', (event) => {
      const value = Number((event.target as HTMLInputElement).value);
      this.options.fov = value;
      this.callbacks.onSetFov(value);
    });
    this.optionsOverlay.querySelector<HTMLInputElement>('#opt-sens')?.addEventListener('input', (event) => {
      const value = Number((event.target as HTMLInputElement).value) / 100000;
      this.options.sensitivity = value;
      this.callbacks.onSetSensitivity(value);
    });
    this.optionsOverlay.querySelector<HTMLInputElement>('#opt-rd')?.addEventListener('input', (event) => {
      const value = Number((event.target as HTMLInputElement).value);
      this.options.renderDistance = value;
      this.callbacks.onSetRenderDistance(value);
    });
    this.optionsOverlay.querySelector<HTMLButtonElement>('button[data-action="back"]')?.addEventListener('click', () => {
      this.callbacks.onBackToPause();
    });
  }

  private bindCraftEvents(): void {
    const buttons = this.inventoryOverlay.querySelectorAll<HTMLButtonElement>('button[data-craft]');
    for (const button of buttons) {
      button.addEventListener('click', () => {
        const recipeId = button.dataset.craft;
        if (!recipeId) {
          return;
        }
        this.callbacks.onCraftRecipe(recipeId);
      });
    }
  }

  private bindInventorySlotEvents(): void {
    const slots = this.inventoryOverlay.querySelectorAll<HTMLElement>('.slot[data-slot-index]');
    for (const slot of slots) {
      slot.addEventListener('mousedown', (event) => {
        event.preventDefault();
        const index = Number(slot.dataset.slotIndex);
        if (Number.isNaN(index)) {
          return;
        }
        if (event.button === 2) {
          this.inventory.handleRightClickOnSlot(index);
          return;
        }
        if (event.button === 0) {
          this.inventory.handleLeftClickOnSlot(index);
        }
      });
    }
  }

  private renderDragPreview(): void {
    const screen = this.gameState.getScreen();
    const cursor = this.inventory.getCursorStack();
    if (screen !== 'inventory' || !cursor) {
      this.dragPreview.classList.add('hidden');
      return;
    }
    this.dragPreview.classList.remove('hidden');
    this.dragPreview.innerHTML = `
      <div class="slot-icon" style="background-image: url('${this.getItemIconUrl(cursor.itemId)}')"></div>
      <div class="slot-item-count">${cursor.count > 1 ? cursor.count : ''}</div>
    `;
  }

  private createBarCells(points: number, kind: 'heart' | 'hunger'): string {
    const cells: string[] = [];
    for (let i = 0; i < 10; i += 1) {
      const value = points - i * 2;
      let suffix = 'empty';
      if (value >= 2) suffix = 'full';
      else if (value === 1) suffix = 'half';
      cells.push(`<div class="icon-cell icon-${kind}-${suffix}"></div>`);
    }
    return cells.join('');
  }

  private getHotbarSlotHtml(slot: InventorySlot, slotIndex: number, selected: boolean): string {
    const classes = ['hotbar-slot'];
    if (selected) {
      classes.push('selected');
    }
    const icon = slot
      ? `<div class="slot-icon" style="background-image: url('${this.getItemIconUrl(slot.itemId)}')"></div>`
      : '';
    const count = slot && slot.count > 1 ? slot.count : '';
    return `
      <div class="${classes.join(' ')}" data-hotbar-index="${slotIndex}">
        ${icon}
        <div class="slot-count">${count}</div>
      </div>
    `;
  }

  private getInventorySlotHtml(slotIndex: number, slot: InventorySlot, selectedHotbar: boolean): string {
    const classes = ['slot'];
    if (selectedHotbar) {
      classes.push('is-hotbar-selected');
    }
    const icon = slot
      ? `<div class="slot-icon" style="background-image: url('${this.getItemIconUrl(slot.itemId)}')"></div>`
      : '';
    const count = slot && slot.count > 1 ? slot.count : '';
    return `
      <div class="${classes.join(' ')}" data-slot-index="${slotIndex}">
        ${icon}
        <div class="slot-item-count">${count}</div>
      </div>
    `;
  }

  private initializeBlockIcons(): void {
    const blockIds = [
      BlockId.Grass,
      BlockId.Dirt,
      BlockId.Stone,
      BlockId.Wood,
      BlockId.Leaves,
      BlockId.Sand,
      BlockId.Gravel,
      BlockId.Water,
      BlockId.Snow,
      BlockId.TallGrass,
      BlockId.FlowerRed,
      BlockId.FlowerYellow,
      BlockId.Mud,
      BlockId.Clay,
      BlockId.Podzol,
      BlockId.Glowshroom,
      BlockId.CandyBlock,
      BlockId.PackedBrick,
    ];
    for (const blockId of blockIds) {
      this.blockIconUrls.set(blockId, this.createBlockIconDataUrl(blockId));
    }
  }

  private getBlockIconUrl(blockId: BlockId): string {
    return this.blockIconUrls.get(blockId) ?? this.createBlockIconDataUrl(blockId);
  }

  private getItemIconUrl(itemId: ItemId): string {
    const blockId = tryGetBlockIdFromItem(itemId);
    if (blockId !== null) {
      return this.getBlockIconUrl(blockId);
    }
    const cached = this.itemIconUrls.get(itemId);
    if (cached) {
      return cached;
    }
    const icon = this.createSpecialItemIconDataUrl(itemId);
    this.itemIconUrls.set(itemId, icon);
    return icon;
  }

  private createBlockIconDataUrl(blockId: BlockId): string {
    const colors = BLOCK_BASE_COLORS[blockId] ?? BLOCK_BASE_COLORS[BlockId.Stone];
    const canvas = document.createElement('canvas');
    canvas.width = 16;
    canvas.height = 16;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return '';
    }

    ctx.fillStyle = colors.base;
    ctx.fillRect(0, 0, 16, 16);
    for (let y = 0; y < 16; y += 1) {
      for (let x = 0; x < 16; x += 1) {
        const h = this.hash(blockId, x, y) % 100;
        if (h > 86) {
          ctx.fillStyle = colors.light;
          ctx.fillRect(x, y, 1, 1);
        } else if (h < 14) {
          ctx.fillStyle = colors.dark;
          ctx.fillRect(x, y, 1, 1);
        }
      }
    }
    if (blockId === BlockId.Grass) {
      ctx.fillStyle = '#5c432b';
      ctx.fillRect(0, 11, 16, 5);
      for (let x = 0; x < 16; x += 1) {
        const n = this.hash(blockId, x, 99) % 100;
        if (n > 55) {
          ctx.fillStyle = '#82c75e';
          ctx.fillRect(x, 10, 1, 1);
        }
      }
    }
    return canvas.toDataURL();
  }

  private hash(seed: number, x: number, y: number): number {
    let h = 2166136261 ^ seed;
    h = Math.imul(h ^ x, 16777619);
    h = Math.imul(h ^ y, 16777619);
    return Math.abs(h);
  }

  private mustGetById(id: string): HTMLElement {
    const element = document.getElementById(id);
    if (!element) {
      throw new Error(`Element UI manquant: ${id}`);
    }
    return element;
  }

  private createSpecialItemIconDataUrl(itemId: ItemId): string {
    const canvas = document.createElement('canvas');
    canvas.width = 16;
    canvas.height = 16;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return '';
    }
    const def = getItemDefinition(itemId);
    ctx.fillStyle = '#30353f';
    ctx.fillRect(0, 0, 16, 16);
    if (def.kind === 'tool') {
      ctx.fillStyle = '#8f643f';
      ctx.fillRect(6, 1, 4, 13);
      ctx.fillStyle = '#9da7b0';
      ctx.fillRect(2, 2, 10, 4);
    } else if (itemId === ItemId.Apple) {
      ctx.fillStyle = '#d45f56';
      ctx.fillRect(4, 5, 8, 8);
      ctx.fillStyle = '#4f8d42';
      ctx.fillRect(7, 3, 3, 2);
    } else if (itemId === ItemId.RawPork) {
      ctx.fillStyle = '#d48e84';
      ctx.fillRect(3, 4, 10, 8);
      ctx.fillStyle = '#f2beb3';
      ctx.fillRect(5, 6, 6, 4);
    } else if (itemId === ItemId.Coin) {
      ctx.fillStyle = '#d4b250';
      ctx.fillRect(3, 3, 10, 10);
      ctx.fillStyle = '#f0dc87';
      ctx.fillRect(5, 5, 6, 6);
    } else if (itemId === ItemId.Wheat) {
      ctx.fillStyle = '#d9c066';
      for (let i = 0; i < 4; i += 1) {
        ctx.fillRect(6 + (i % 2), 3 + i * 3, 4, 1);
      }
      ctx.fillStyle = '#8ca14f';
      ctx.fillRect(7, 2, 2, 12);
    } else if (itemId === ItemId.ForestBrew) {
      ctx.fillStyle = '#5f4a39';
      ctx.fillRect(5, 2, 6, 2);
      ctx.fillStyle = '#d09a53';
      ctx.fillRect(4, 4, 8, 9);
    } else if (itemId === ItemId.Flint) {
      ctx.fillStyle = '#a0a6ae';
      ctx.fillRect(4, 3, 8, 10);
      ctx.fillStyle = '#818892';
      ctx.fillRect(5, 5, 6, 5);
    } else {
      ctx.fillStyle = '#bcbcbc';
      ctx.fillRect(4, 4, 8, 8);
    }
    return canvas.toDataURL();
  }

  setCrosshairMining(active: boolean): void {
    this.crosshair.classList.toggle('is-mining', active);
  }

  showToast(message: string): void {
    const item = document.createElement('div');
    item.className = 'hud-toast';
    item.textContent = message;
    this.notifications.appendChild(item);
    window.setTimeout(() => {
      item.classList.add('fade-out');
      window.setTimeout(() => item.remove(), 260);
    }, 1700);
  }

  setInteractionHint(text: string | null): void {
    if (!text) {
      this.interactionHint.classList.add('hidden');
      this.interactionHint.textContent = '';
      return;
    }
    this.interactionHint.classList.remove('hidden');
    this.interactionHint.textContent = text;
  }

  flashDamage(): void {
    this.damageFlash.classList.remove('active');
    void this.damageFlash.offsetWidth;
    this.damageFlash.classList.add('active');
  }

  renderDialogue(title: string, description: string, canTrade: boolean): void {
    this.dialogueOverlay.innerHTML = `
      <div class="panel panel-small">
        <div class="panel-title">${title}</div>
        <p class="panel-text">${description}</p>
        <div class="menu-buttons">
          ${canTrade ? '<button class="menu-button" data-action="trade">Echanger</button>' : ''}
          <button class="menu-button" data-action="close-dialogue">Fermer</button>
        </div>
      </div>
    `;
  }

  bindDialogueActions(onTrade: () => void, onClose: () => void): void {
    this.dialogueOverlay.querySelector<HTMLButtonElement>('button[data-action="trade"]')?.addEventListener('click', onTrade);
    this.dialogueOverlay
      .querySelector<HTMLButtonElement>('button[data-action="close-dialogue"]')
      ?.addEventListener('click', onClose);
  }

  renderTrading(title: string, offersHtml: string): void {
    this.tradingOverlay.innerHTML = `
      <div class="panel panel-small">
        <div class="panel-title">${title}</div>
        <div class="trade-list">${offersHtml}</div>
        <div class="menu-buttons">
          <button class="menu-button" data-action="close-trading">Fermer</button>
        </div>
      </div>
    `;
  }

  bindTradingClose(onClose: () => void): void {
    this.tradingOverlay
      .querySelector<HTMLButtonElement>('button[data-action="close-trading"]')
      ?.addEventListener('click', onClose);
  }
}
