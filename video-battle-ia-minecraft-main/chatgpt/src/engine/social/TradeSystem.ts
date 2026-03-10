import { InventorySystem } from '../inventory/InventorySystem';
import { ItemId, type ItemId as ItemIdType, createBlockItemId } from '../inventory/InventoryTypes';
import { BlockId } from '../world/BlockTypes';
import { type NpcEntity } from '../npc/NpcTypes';

export type TradeOffer = {
  id: string;
  label: string;
  costItemId: ItemIdType;
  costCount: number;
  rewardItemId: ItemIdType;
  rewardCount: number;
};

const MERCHANT_OFFERS: TradeOffer[] = [
  {
    id: 'merchant-1',
    label: 'Echange decoratif',
    costItemId: ItemId.Coin,
    costCount: 3,
    rewardItemId: createBlockItemId(BlockId.PackedBrick),
    rewardCount: 4,
  },
  {
    id: 'merchant-2',
    label: 'Champignon lumineux',
    costItemId: ItemId.Coin,
    costCount: 2,
    rewardItemId: createBlockItemId(BlockId.Glowshroom),
    rewardCount: 2,
  },
];

const BREWER_OFFERS: TradeOffer[] = [
  {
    id: 'brewer-1',
    label: 'Biere boost',
    costItemId: ItemId.Wheat,
    costCount: 4,
    rewardItemId: ItemId.ForestBrew,
    rewardCount: 1,
  },
  {
    id: 'brewer-2',
    label: 'Pomme tonique',
    costItemId: createBlockItemId(BlockId.Leaves),
    costCount: 5,
    rewardItemId: ItemId.Apple,
    rewardCount: 1,
  },
];

export class TradeSystem {
  private readonly inventory: InventorySystem;

  constructor(inventory: InventorySystem) {
    this.inventory = inventory;
  }

  getOffers(npc: NpcEntity): TradeOffer[] {
    if (npc.profession === 'merchant') {
      return MERCHANT_OFFERS;
    }
    return BREWER_OFFERS;
  }

  executeOffer(offerId: string, npc: NpcEntity): { success: boolean; message: string } {
    const offer = this.getOffers(npc).find((candidate) => candidate.id === offerId);
    if (!offer) {
      return { success: false, message: 'Offre introuvable' };
    }
    if (!this.inventory.hasItems(offer.costItemId, offer.costCount)) {
      return { success: false, message: 'Ressources insuffisantes' };
    }
    this.inventory.removeItems(offer.costItemId, offer.costCount);
    const added = this.inventory.addItemById(offer.rewardItemId, offer.rewardCount);
    if (!added) {
      return { success: false, message: 'Inventaire plein' };
    }
    return { success: true, message: `Transaction: ${offer.label}` };
  }
}
