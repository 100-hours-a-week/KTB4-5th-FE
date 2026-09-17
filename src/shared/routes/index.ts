export const routes = {
  home: "/",
  login: "/login",
  refrigerator: "/refrigerator",
  notifications: "/notifications",
  recommendations: "/recommendations",
  me: "/me",
  registerIngredient: "/refrigerator/register",
  ingredientDetail: (ingredientId: string) =>
    `/refrigerator/ingredients/${encodeURIComponent(ingredientId)}`,
  ingredientEdit: (ingredientId: string) =>
    `/refrigerator/ingredients/${encodeURIComponent(ingredientId)}/edit`,
} as const;
