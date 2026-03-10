import { type NpcEntity } from '../npc/NpcTypes';
import { HudUi } from './HudUi';

export class DialogueUi {
  private readonly hud: HudUi;

  constructor(hud: HudUi) {
    this.hud = hud;
  }

  open(npc: NpcEntity, onTrade: () => void, onClose: () => void): void {
    this.hud.renderDialogue(npc.displayName, npc.talkLine, true);
    this.hud.bindDialogueActions(onTrade, onClose);
  }
}
