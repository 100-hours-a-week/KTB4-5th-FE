import {
  formatDaysUntilExpiration,
  INGREDIENT_STATUS_BADGE_TONES,
  INGREDIENT_STATUS_LABELS,
  type IngredientStatus,
} from "@/entities/ingredient";
import type { BadgeTone } from "@/shared/ui/badge";

import type { HomeAttentionItem, StorageMethod } from "../model/home-summary";

const storageLabels = {
  cold: "냉장",
  frozen: "냉동",
} satisfies Record<StorageMethod, string>;

/** 홈 mock은 상태 대신 남은 일수만 갖고 있어 표시 직전에 상태로 환산한다. */
function toStatus(daysLeft: number): IngredientStatus {
  if (daysLeft < 0) {
    return "EXPIRED";
  }

  return daysLeft <= 3 ? "EXPIRING_SOON" : "NORMAL";
}

export function describeExpiryBadge(daysLeft: number): {
  tone: BadgeTone;
  statusLabel: string;
  dDayLabel: string;
} {
  const status = toStatus(daysLeft);

  return {
    tone: INGREDIENT_STATUS_BADGE_TONES[status],
    statusLabel: INGREDIENT_STATUS_LABELS[status],
    dDayLabel: formatDaysUntilExpiration(daysLeft),
  };
}

export function describeExpiryHelper(item: HomeAttentionItem): string {
  const storage = storageLabels[item.storage];
  const quantity = item.quantity;

  return `${storage} · ${quantity}개`;
}
