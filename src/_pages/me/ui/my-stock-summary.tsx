"use client";

import { useQuery } from "@tanstack/react-query";

import {
  DEFAULT_INGREDIENT_LIST_SORT,
  ingredientQueries,
  toIngredientListQueryString,
  type IngredientListQuery,
} from "@/entities/ingredient";
import { useCurrentRefrigeratorId } from "@/entities/refrigerator";
import { routes } from "@/shared/routes";
import { AppLink } from "@/shared/ui/app-link";

const EXPIRED_QUERY: IngredientListQuery = {
  filter: "EXPIRED",
  category: null,
  sort: DEFAULT_INGREDIENT_LIST_SORT,
  keyword: null,
};

const EXPIRED_LIST_HREF = `${routes.refrigerator}?${toIngredientListQueryString(EXPIRED_QUERY)}`;

const tileClassName =
  "flex flex-1 flex-col items-center gap-1 rounded-[4px] bg-white py-4 no-underline shadow-app-sm";

export function MyStockSummary() {
  const refrigeratorId = useCurrentRefrigeratorId();
  const { data } = useQuery({
    ...ingredientQueries.firstPage(refrigeratorId ?? "", EXPIRED_QUERY),
    enabled: Boolean(refrigeratorId),
  });

  const format = (count: number | undefined) =>
    count === undefined ? "-" : `${count}개`;

  return (
    <div className="flex gap-3">
      <div className={tileClassName}>
        <span className="font-app-heading text-[17px] font-black text-app-ink">
          {format(data?.ingredientsNum)}
        </span>
        <span className="text-[12px] text-app-ink/55">보유 재고</span>
      </div>
      <AppLink
        href={EXPIRED_LIST_HREF}
        className={`${tileClassName} hover:bg-app-neutral-100 active:bg-app-neutral-200`}
      >
        <span className="font-app-heading text-[17px] font-black text-app-ink">
          {format(data?.filteredCount)}
        </span>
        <span className="text-[12px] text-app-ink/55">이번 달 만료</span>
      </AppLink>
    </div>
  );
}
