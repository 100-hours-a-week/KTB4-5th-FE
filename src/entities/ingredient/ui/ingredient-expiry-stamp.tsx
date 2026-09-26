import { formatDaysUntilExpiration } from "../lib/format-ingredient";
import { INGREDIENT_STATUS_LABELS } from "../lib/ingredient-labels";
import type { IngredientStatus } from "../model/ingredient";

type IngredientExpiryStampProps = {
  status: IngredientStatus;
  daysUntilExpiration: number;
  className?: string;
};

const statusColorClasses = {
  EXPIRED: "border-app-primary text-app-primary",
  EXPIRING_SOON: "border-app-warning text-app-warning",
  NORMAL: "border-app-fresh text-app-fresh",
} satisfies Record<IngredientStatus, string>;

export function IngredientExpiryStamp({
  className = "",
  daysUntilExpiration,
  status,
}: IngredientExpiryStampProps) {
  return (
    <span
      className={`inline-flex size-12 flex-none -rotate-9 flex-col items-center justify-center rounded-full border-2 opacity-90 ${statusColorClasses[status]} ${className}`}
    >
      <span className="font-app-heading text-[14px] font-black leading-none">
        {INGREDIENT_STATUS_LABELS[status]}
      </span>
      <span className="mt-0.5 whitespace-nowrap font-app-mono text-[9px] font-bold leading-none">
        {formatDaysUntilExpiration(daysUntilExpiration)}
      </span>
    </span>
  );
}
