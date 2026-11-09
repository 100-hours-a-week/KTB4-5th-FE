"use client";

import { useQuery } from "@tanstack/react-query";

import {
  DEFAULT_INGREDIENT_LIST_QUERY,
  ingredientQueries,
} from "@/entities/ingredient";

export function useInventoryEmpty(refrigeratorId: string | null | undefined) {
  const { data } = useQuery({
    ...ingredientQueries.firstPage(
      refrigeratorId ?? "",
      DEFAULT_INGREDIENT_LIST_QUERY,
    ),
    enabled: Boolean(refrigeratorId),
    select: (page) => page.ingredientsNum === 0,
  });
  return data === true;
}
