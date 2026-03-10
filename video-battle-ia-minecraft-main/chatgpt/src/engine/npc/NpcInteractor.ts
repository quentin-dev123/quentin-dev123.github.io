import { PerspectiveCamera, Vector3 } from 'three';
import { NpcSystem } from './NpcSystem';
import { type NpcEntity } from './NpcTypes';

export class NpcInteractor {
  private readonly camera: PerspectiveCamera;
  private readonly npcSystem: NpcSystem;
  private readonly getPlayerPosition: () => Vector3;
  private readonly canInteract: () => boolean;
  private readonly openDialogue: (npc: NpcEntity) => void;
  private readonly rayOrigin = new Vector3();
  private readonly rayDirection = new Vector3();
  private readonly toNpc = new Vector3();
  private focusedNpc: NpcEntity | null = null;

  constructor(
    camera: PerspectiveCamera,
    npcSystem: NpcSystem,
    getPlayerPosition: () => Vector3,
    canInteract: () => boolean,
    openDialogue: (npc: NpcEntity) => void,
  ) {
    this.camera = camera;
    this.npcSystem = npcSystem;
    this.getPlayerPosition = getPlayerPosition;
    this.canInteract = canInteract;
    this.openDialogue = openDialogue;
    window.addEventListener('keydown', (event) => {
      if (event.code !== 'KeyF' || event.repeat || !this.canInteract()) {
        return;
      }
      if (!this.focusedNpc) {
        return;
      }
      this.openDialogue(this.focusedNpc);
    });
  }

  update(): NpcEntity | null {
    const npc = this.npcSystem.getClosestNpc(this.getPlayerPosition());
    if (!npc) {
      this.focusedNpc = null;
      return null;
    }
    this.camera.getWorldPosition(this.rayOrigin);
    this.camera.getWorldDirection(this.rayDirection).normalize();
    this.toNpc.copy(npc.position).sub(this.rayOrigin).normalize();
    const alignment = this.rayDirection.dot(this.toNpc);
    if (alignment < 0.75) {
      this.focusedNpc = null;
      return null;
    }
    this.focusedNpc = npc;
    return npc;
  }
}
