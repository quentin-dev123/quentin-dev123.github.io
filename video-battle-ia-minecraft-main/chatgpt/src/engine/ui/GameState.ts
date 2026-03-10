export type GameScreen = 'gameplay' | 'inventory' | 'pause' | 'options' | 'dialogue' | 'trading';

type GameStateListener = (screen: GameScreen) => void;

export class GameState {
  private screen: GameScreen = 'gameplay';
  private readonly listeners = new Set<GameStateListener>();
  private readonly gameDomElement: HTMLElement;

  constructor(gameDomElement: HTMLElement) {
    this.gameDomElement = gameDomElement;
    document.addEventListener('pointerlockchange', () => {
      if (this.screen !== 'gameplay') {
        return;
      }
      if (document.pointerLockElement !== this.gameDomElement) {
        this.setScreen('pause');
      }
    });
  }

  getScreen(): GameScreen {
    return this.screen;
  }

  isGameplayActive(): boolean {
    return this.screen === 'gameplay';
  }

  subscribe(listener: GameStateListener): () => void {
    this.listeners.add(listener);
    listener(this.screen);
    return () => this.listeners.delete(listener);
  }

  toggleInventory(): void {
    if (this.screen === 'gameplay') {
      this.setScreen('inventory');
      return;
    }
    if (this.screen === 'inventory') {
      this.setScreen('gameplay');
    }
  }

  handleEscape(): void {
    if (this.screen === 'gameplay') {
      this.setScreen('pause');
      return;
    }
    if (this.screen === 'inventory') {
      this.setScreen('gameplay');
      return;
    }
    if (this.screen === 'pause') {
      this.setScreen('gameplay');
      return;
    }
    if (this.screen === 'options') {
      this.setScreen('pause');
      return;
    }
    if (this.screen === 'dialogue' || this.screen === 'trading') {
      this.setScreen('gameplay');
    }
  }

  openOptions(): void {
    if (this.screen === 'pause') {
      this.setScreen('options');
    }
  }

  resumeGameplay(): void {
    this.setScreen('gameplay');
  }

  closeOptionsToPause(): void {
    if (this.screen === 'options') {
      this.setScreen('pause');
    }
  }

  openDialogue(): void {
    if (this.screen === 'gameplay') {
      this.setScreen('dialogue');
    }
  }

  openTrading(): void {
    if (this.screen === 'dialogue' || this.screen === 'gameplay') {
      this.setScreen('trading');
    }
  }

  private setScreen(next: GameScreen): void {
    if (this.screen === next) {
      return;
    }
    this.screen = next;
    this.syncPointerLock();
    for (const listener of this.listeners) {
      listener(next);
    }
  }

  private syncPointerLock(): void {
    if (this.screen === 'gameplay') {
      if (document.pointerLockElement !== this.gameDomElement) {
        void this.gameDomElement.requestPointerLock();
      }
      return;
    }
    if (document.pointerLockElement === this.gameDomElement) {
      void document.exitPointerLock();
    }
  }
}
