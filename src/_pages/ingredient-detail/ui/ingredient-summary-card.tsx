import type { ReactNode } from "react";

import {
  formatIngredientQuantity,
  formatIngredientWeight,
  INGREDIENT_STORAGE_TYPE_LABELS,
  IngredientExpiryStamp,
  type IngredientDetail,
} from "@/entities/ingredient";
import { formatIsoDate } from "@/shared/lib/date";

import {
  formatDDay,
  formatExpirationDeadline,
} from "../lib/format-ingredient-detail";

type IngredientSummaryCardProps = {
  ingredient: IngredientDetail;
};

type DetailRow = {
  label: string;
  value: ReactNode;
  muted?: boolean;
};

export function IngredientSummaryCard({
  ingredient,
}: IngredientSummaryCardProps) {
  const quantity =
    ingredient.quantity === null
      ? null
      : formatIngredientQuantity(ingredient.quantity);
  const weight = formatIngredientWeight(
    ingredient.weightValue,
    ingredient.weightUnit,
  );

  const rows: DetailRow[] = [
    {
      label: "등록일",
      value: formatIsoDate(ingredient.createdDate),
    },
    {
      label: "유통기한",
      value: formatIsoDate(ingredient.expirationDate),
    },
    {
      label: "수량",
      value: quantity ?? "안 적음",
      muted: quantity === null,
    },
    {
      label: "무게",
      value: weight ?? "안 적음",
      muted: weight === null,
    },
    {
      label: "보관 방법",
      value: INGREDIENT_STORAGE_TYPE_LABELS[ingredient.storageType],
    },
  ];

  return (
    <section
      aria-labelledby="ingredient-detail-name"
      className="relative px-5 pb-4 pt-[26px]"
    >
      <div
        aria-hidden="true"
        className="absolute inset-x-5 bottom-1 top-[34px] -rotate-2 rounded-[3px] bg-app-paper shadow-[0_2px_6px_color-mix(in_srgb,var(--color-ink)_8%,transparent)]"
      />
      <div
        aria-hidden="true"
        className="absolute left-1/2 top-3.5 z-[4] -ml-[38px] h-5 w-[76px] bg-app-warning/70"
      />

      <div className="relative z-[2] overflow-hidden rounded-[3px] bg-white shadow-[0_8px_22px_color-mix(in_srgb,var(--color-ink)_15%,transparent)]">
        <div className="px-[22px] pb-4 pt-6">
          <div className="flex flex-wrap items-center gap-[9px]">
            <h2
              id="ingredient-detail-name"
              className="m-0 min-w-0 break-keep font-app-heading text-[30px] font-black leading-none text-app-ink"
            >
              {ingredient.name}
            </h2>
            <IngredientExpiryStamp
              status={ingredient.status}
              daysUntilExpiration={ingredient.daysUntilExpiration}
              className="ml-auto"
            />
          </div>

          <p className="m-[18px_0_0] flex items-baseline gap-3 border-y-[1.5px] border-app-ink/18 pb-3 pt-3.5">
            <span
              className={`flex-none font-app-mono text-[46px] font-black leading-none tracking-[-0.03em] ${
                ingredient.status === "EXPIRED"
                  ? "text-app-primary"
                  : "text-app-ink"
              }`}
            >
              {formatDDay(ingredient.daysUntilExpiration)}
            </span>
            <span className="min-w-0 flex-1 text-[15px] leading-[1.1] text-app-ink/70">
              {formatExpirationDeadline(ingredient.expirationDate)}
            </span>
          </p>
        </div>

        <dl className="m-0 px-[22px] pb-[18px]">
          {rows.map((row) => (
            <div
              key={row.label}
              className="flex items-baseline gap-2.5 border-b border-app-ink/8 py-2.5 last:border-b-0"
            >
              <dt className="w-[74px] flex-none text-[12.5px] text-app-ink/60">
                {row.label}
              </dt>
              <dd
                className={`m-0 min-w-0 flex-1 text-[15px] leading-tight ${
                  row.muted ? "text-app-ink/55" : "font-bold text-app-ink"
                }`}
              >
                {row.value}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
