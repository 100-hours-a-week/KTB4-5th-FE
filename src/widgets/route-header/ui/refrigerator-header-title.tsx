"use client";

import { useQuery } from "@tanstack/react-query";

import {
  formatRefrigeratorTitle,
  refrigeratorQueries,
  useCurrentRefrigeratorId,
} from "@/entities/refrigerator";

type RefrigeratorHeaderTitleProps = {
  fallback: string;
};

export function RefrigeratorHeaderTitle({
  fallback,
}: RefrigeratorHeaderTitleProps) {
  const currentRefrigeratorId = useCurrentRefrigeratorId();
  const { data } = useQuery(refrigeratorQueries.current());

  if (!data || data.length === 0) {
    return fallback;
  }

  const currentRefrigerator =
    data.find(
      (refrigerator) => refrigerator.refrigeratorId === currentRefrigeratorId,
    ) ?? data[0];

  return formatRefrigeratorTitle(currentRefrigerator.name);
}
