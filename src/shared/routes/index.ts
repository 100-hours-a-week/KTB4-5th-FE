export const routes = {
  home: "/",
  login: "/login",
  offline: "/~offline",
  refrigerator: "/refrigerator",
  notifications: "/notifications",
  registerIngredient: "/refrigerator/register",
  ingredientDetail: (ingredientId: string) =>
    `/refrigerator/ingredients/${encodeURIComponent(ingredientId)}`,
  ingredientEdit: (ingredientId: string) =>
    `/refrigerator/ingredients/${encodeURIComponent(ingredientId)}/edit`,
} as const;
