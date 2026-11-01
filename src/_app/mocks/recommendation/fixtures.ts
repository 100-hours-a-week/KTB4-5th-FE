import type { RecipeDetail, Recommendation } from "@/entities/recommendation";
import { getTodayInSeoul } from "@/shared/lib/seoul-date";

export function createMockRecipes(): Recommendation["recipes"] {
  return [
    "두부김치",
    "달걀말이",
    "된장찌개",
    "채소 리소토",
    "두부조림",
    "김치볶음밥",
    "달걀국",
    "채소볶음",
    "김치전",
    "두부 샐러드",
  ].map((name, i) => ({
    recipeId: String(51 + i),
    name,
    imageUrl: null,
    cookingTimeMinutes: 15 + i,
    ingredientCounts: {
      total: 4,
      owned: i < 3 ? 3 : 2,
      expiring: i < 2 ? 2 : 1,
    },
  }));
}

export function createMockRecipe(recipeId: string): RecipeDetail {
  const today = getTodayInSeoul();
  const date = (days: number) =>
    new Date(Date.parse(today) + days * 86400000).toISOString().slice(0, 10);
  return {
    recipeId,
    name:
      createMockRecipes().find((r) => r.recipeId === recipeId)?.name ??
      "두부김치",
    imageUrl: null,
    cookingTimeMinutes: 15,
    targetServings: 2,
    expiringIngredientCount: 1,
    ingredients: [
      {
        recipeIngredientId: "11",
        name: "두부",
        requiredAmount: 2,
        amountText: "2개",
        unit: "EA",
        stocks: [
          {
            ingredientId: "101",
            ownedAmount: 1,
            usedAmount: null,
            allocationStatus: "UNRESOLVED",
            unit: "EA",
            expirationDate: date(-1),
          },
          {
            ingredientId: "102",
            ownedAmount: 2,
            usedAmount: null,
            allocationStatus: "UNRESOLVED",
            unit: "EA",
            expirationDate: date(2),
          },
        ],
      },
      {
        recipeIngredientId: "12",
        name: "김치",
        requiredAmount: 200,
        amountText: "200g",
        unit: "G",
        stocks: [
          {
            ingredientId: "103",
            ownedAmount: 100,
            usedAmount: null,
            allocationStatus: "UNRESOLVED",
            unit: "G",
            expirationDate: date(6),
          },
        ],
      },
      {
        recipeIngredientId: "13",
        name: "대파",
        requiredAmount: 1,
        amountText: "1개",
        unit: "EA",
        stocks: [
          {
            ingredientId: "104",
            ownedAmount: 3,
            usedAmount: null,
            allocationStatus: "UNRESOLVED",
            unit: "EA",
            expirationDate: date(9),
          },
        ],
      },
      {
        recipeIngredientId: "14",
        name: "참기름",
        requiredAmount: null,
        amountText: "1큰술",
        unit: null,
        stocks: [],
      },
    ],
    steps: [
      { stepNo: 1, instruction: "두부를 도톰하게 썰어 물기를 뺀다." },
      { stepNo: 2, instruction: "팬에 기름을 두르고 두부를 노릇하게 굽는다." },
      { stepNo: 3, instruction: "김치와 대파를 볶다가 참기름을 두른다." },
      { stepNo: 4, instruction: "접시에 두부를 담고 볶은 김치를 올린다." },
    ],
  };
}
