export const routes = {
  home: "/",
  login: "/login",
  refrigerator: "/refrigerator",
  notifications: "/notifications",
  ingredients: "/ingredients",
  registerIngredient: "/ingredients/register",
  ingredientDetail: (ingredientId: string) =>
    `/ingredients/${encodeURIComponent(ingredientId)}`,
} as const;
