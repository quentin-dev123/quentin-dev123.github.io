import { InventorySystem } from '../inventory/InventorySystem';
import { ItemId, type ItemId as ItemIdType, createBlockItemId } from '../inventory/InventoryTypes';
import { BlockId } from '../world/BlockTypes';

type CraftRecipe = {
  id: string;
  label: string;
  inputs: Array<{ itemId: ItemIdType; count: number }>;
  output: { itemId: ItemIdType; count: number };
};

const RECIPES: CraftRecipe[] = [
  {
    id: 'tool_pickaxe',
    label: 'Pioche en bois',
    inputs: [
      { itemId: createBlockItemId(BlockId.Wood), count: 3 },
      { itemId: ItemId.Flint, count: 2 },
    ],
    output: { itemId: ItemId.WoodenPickaxe, count: 1 },
  },
  {
    id: 'food_brew',
    label: 'Biere de foret',
    inputs: [
      { itemId: ItemId.Wheat, count: 3 },
      { itemId: ItemId.Apple, count: 1 },
    ],
    output: { itemId: ItemId.ForestBrew, count: 1 },
  },
  {
    id: 'block_candy',
    label: 'CandyBlock',
    inputs: [
      { itemId: createBlockItemId(BlockId.Sand), count: 2 },
      { itemId: ItemId.Apple, count: 1 },
    ],
    output: { itemId: createBlockItemId(BlockId.CandyBlock), count: 2 },
  },
];

export class CraftingSystem {
  private readonly inventory: InventorySystem;

  constructor(inventory: InventorySystem) {
    this.inventory = inventory;
  }

  getRecipes(): CraftRecipe[] {
    return RECIPES;
  }

  craft(recipeId: string): { success: boolean; message: string } {
    const recipe = RECIPES.find((candidate) => candidate.id === recipeId);
    if (!recipe) {
      return { success: false, message: 'Recette inconnue' };
    }
    for (const input of recipe.inputs) {
      if (!this.inventory.hasItems(input.itemId, input.count)) {
        return { success: false, message: `Ressources insuffisantes pour ${recipe.label}` };
      }
    }
    for (const input of recipe.inputs) {
      this.inventory.removeItems(input.itemId, input.count);
    }
    const inserted = this.inventory.addItemById(recipe.output.itemId, recipe.output.count);
    if (!inserted) {
      return { success: false, message: 'Inventaire plein' };
    }
    return { success: true, message: `${recipe.label} crafté` };
  }
}
