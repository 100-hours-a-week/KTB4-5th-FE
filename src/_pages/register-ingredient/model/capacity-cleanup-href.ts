import {
  DEFAULT_INGREDIENT_LIST_SORT,
  toIngredientListQueryString,
} from "@/entities/ingredient";
import { routes } from "@/shared/routes";

export const CAPACITY_CLEANUP_HREF = `${routes.refrigerator}?${toIngredientListQueryString(
  { filter: "EXPIRED", category: null, sort: DEFAULT_INGREDIENT_LIST_SORT },
)}`;
