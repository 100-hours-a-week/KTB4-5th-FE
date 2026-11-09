import type {
  RecipeDetail,
  RecipeIngredient,
  RecipeAmountUnit,
} from "@/entities/recommendation";

export type RecipeIngredientState =
  | { kind: "owned"; ingredientId: string; daysUntilExpiration: number }
  | { kind: "missing" };

export type RecipeConsumeRow = {
  ingredientId: string;
  name: string;
  amountText: string;
  before: number;
  after: number;
  unitLabel: string;
};

const UNIT_LABELS = {
  EA: "개",
  G: "g",
  ML: "ml",
} satisfies Record<RecipeAmountUnit, string>;

const DAY_MS = 86_400_000;

function daysFrom(today: string, date: string) {
  return Math.round((Date.parse(date) - Date.parse(today)) / DAY_MS);
}

function usableStocks(ingredient: RecipeIngredient, today: string) {
  return ingredient.stocks
    .filter((stock) => daysFrom(today, stock.expirationDate) >= 0)
    .toSorted((a, b) => a.expirationDate.localeCompare(b.expirationDate));
}

export function getRecipeIngredientState(
  ingredient: RecipeIngredient,
  today: string,
): RecipeIngredientState {
  const [nearest] = usableStocks(ingredient, today);

  if (!nearest) {
    return { kind: "missing" };
  }

  return {
    kind: "owned",
    ingredientId: nearest.ingredientId,
    daysUntilExpiration: daysFrom(today, nearest.expirationDate),
  };
}

export function getRecipeConsumeRows(recipe: RecipeDetail): RecipeConsumeRow[] {
  const rows = new Map<string, RecipeConsumeRow>();
  for (const ingredient of recipe.ingredients) {
    for (const stock of ingredient.stocks) {
      if (stock.allocationStatus !== "CALCULATED" || !stock.usedAmount)
        continue;
      const row = rows.get(stock.ingredientId) ?? {
        ingredientId: stock.ingredientId,
        name: ingredient.name,
        amountText: "",
        before: stock.ownedAmount,
        after: stock.ownedAmount,
        unitLabel: UNIT_LABELS[stock.unit],
      };
      row.after -= stock.usedAmount;
      row.amountText = `${row.before - row.after}${row.unitLabel}`;
      rows.set(stock.ingredientId, row);
    }
  }
  return [...rows.values()];
}
