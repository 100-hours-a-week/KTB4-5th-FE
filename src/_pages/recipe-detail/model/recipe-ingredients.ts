import type {
  RecipeDetail,
  RecipeIngredient,
  RecipeAmountUnit,
} from "@/entities/recommendation";

export type RecipeIngredientState =
  | { kind: "owned"; ingredientId: string; daysUntilExpiration: number }
  | { kind: "short"; ingredientId: string; shortage: string }
  | { kind: "missing" };

export type RecipeConsumeRow = {
  recipeIngredientId: string;
  name: string;
  amountText: string;
  before: number;
  after: number;
  unitLabel: string;
  partial: boolean;
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

function comparableAmount(ingredient: RecipeIngredient, today: string) {
  const stocks = usableStocks(ingredient, today);
  const { requiredAmount, unit } = ingredient;

  if (
    stocks.length === 0 ||
    requiredAmount === null ||
    unit === null ||
    stocks.some((stock) => stock.unit !== unit)
  ) {
    return null;
  }

  return {
    required: requiredAmount,
    owned: stocks.reduce((sum, stock) => sum + stock.ownedAmount, 0),
    unitLabel: UNIT_LABELS[unit],
  };
}

export function getRecipeIngredientState(
  ingredient: RecipeIngredient,
  today: string,
): RecipeIngredientState {
  const [nearest] = usableStocks(ingredient, today);

  if (!nearest) {
    return { kind: "missing" };
  }

  const amount = comparableAmount(ingredient, today);

  if (amount && amount.owned < amount.required) {
    return {
      kind: "short",
      ingredientId: nearest.ingredientId,
      shortage: `${amount.required - amount.owned}${amount.unitLabel}`,
    };
  }

  return {
    kind: "owned",
    ingredientId: nearest.ingredientId,
    daysUntilExpiration: daysFrom(today, nearest.expirationDate),
  };
}

export function getRecipeConsumeRows(
  recipe: RecipeDetail,
  today: string,
): RecipeConsumeRow[] {
  return recipe.ingredients.flatMap((ingredient) => {
    const amount = comparableAmount(ingredient, today);

    if (!amount) {
      return [];
    }

    return {
      recipeIngredientId: ingredient.recipeIngredientId,
      name: ingredient.name,
      amountText: ingredient.amountText,
      before: amount.owned,
      after: Math.max(0, amount.owned - amount.required),
      unitLabel: amount.unitLabel,
      partial: amount.owned < amount.required,
    };
  });
}
