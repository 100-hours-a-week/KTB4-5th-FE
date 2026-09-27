import {
  LOGIN_REDIRECT_REASON_PARAM,
  type LoginRedirectReason,
} from "./login-redirect-reason";

export const routes = {
  offline: "/~offline",
  home: "/",
  login: "/login",
  loginWithReason: (reason: LoginRedirectReason) =>
    `/login?${LOGIN_REDIRECT_REASON_PARAM}=${reason}`,
  refrigerator: "/refrigerator",
  notifications: "/notifications",
  recommendations: "/recommendations",
  me: "/me",
  registerIngredient: "/refrigerator/register",
  registerIngredientManual: "/refrigerator/register/manual",
  registerIngredientMergeResult: "/refrigerator/register/merge-result",
  ingredientDetail: (ingredientId: string) =>
    `/refrigerator/ingredients/${encodeURIComponent(ingredientId)}`,
  ingredientEdit: (ingredientId: string) =>
    `/refrigerator/ingredients/${encodeURIComponent(ingredientId)}/edit`,
} as const;

export {
  isLoginRedirectReason,
  LOGIN_REDIRECT_REASON_PARAM,
  loginRedirectReasons,
} from "./login-redirect-reason";
export type { LoginRedirectReason } from "./login-redirect-reason";
