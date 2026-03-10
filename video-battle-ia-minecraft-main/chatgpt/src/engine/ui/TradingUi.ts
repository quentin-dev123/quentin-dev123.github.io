import { type NpcEntity } from '../npc/NpcTypes';
import { getItemDefinition } from '../inventory/InventoryTypes';
import { TradeSystem } from '../social/TradeSystem';
import { HudUi } from './HudUi';

export class TradingUi {
  private readonly hud: HudUi;
  private readonly tradeSystem: TradeSystem;

  constructor(hud: HudUi, tradeSystem: TradeSystem) {
    this.hud = hud;
    this.tradeSystem = tradeSystem;
  }

  open(npc: NpcEntity, onClose: () => void, onTraded: (message: string) => void): void {
    const offers = this.tradeSystem.getOffers(npc);
    const offersHtml = offers
      .map((offer) => {
        const costLabel = getItemDefinition(offer.costItemId).label;
        const rewardLabel = getItemDefinition(offer.rewardItemId).label;
        return `
          <div class="trade-offer">
            <div class="trade-offer-text">${offer.costCount}x ${costLabel} -> ${offer.rewardCount}x ${rewardLabel}</div>
            <button class="menu-button" data-offer-id="${offer.id}">Echanger</button>
          </div>
        `;
      })
      .join('');
    this.hud.renderTrading(`Troc avec ${npc.displayName}`, offersHtml);
    const root = document.getElementById('trading-overlay');
    if (root) {
      const buttons = root.querySelectorAll<HTMLButtonElement>('button[data-offer-id]');
      for (const button of buttons) {
        button.addEventListener('click', () => {
          const offerId = button.dataset.offerId;
          if (!offerId) {
            return;
          }
          const result = this.tradeSystem.executeOffer(offerId, npc);
          onTraded(result.message);
          if (result.success) {
            this.open(npc, onClose, onTraded);
          }
        });
      }
    }
    this.hud.bindTradingClose(onClose);
  }
}
