"use client";

import { useQuery } from "@tanstack/react-query";

import {
  DEFAULT_INGREDIENT_LIST_QUERY,
  ingredientQueries,
} from "@/entities/ingredient";
import {
  formatRefrigeratorTitle,
  useCurrentRefrigeratorId,
} from "@/entities/refrigerator";

type RefrigeratorHeaderTitleProps = {
  fallback: string;
};

export function RefrigeratorHeaderTitle({
  fallback,
}: RefrigeratorHeaderTitleProps) {
  const currentRefrigeratorId = useCurrentRefrigeratorId();
  const { data: name, isPending } = useQuery({
    ...ingredientQueries.firstPage(
      currentRefrigeratorId ?? "",
      DEFAULT_INGREDIENT_LIST_QUERY,
    ),
    enabled: Boolean(currentRefrigeratorId),
    select: (page) => page.refrigeratorName,
  });

  if (isPending) {
    return null;
  }

  return name ? formatRefrigeratorTitle(name) : fallback;
}
