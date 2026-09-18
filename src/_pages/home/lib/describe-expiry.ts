import type { ChipTone } from "@/shared/ui/chip";

import type { HomeAttentionItem, StorageMethod } from "../model/home-summary";

const storageLabels = {
  cold: "냉장",
  frozen: "냉동",
} satisfies Record<StorageMethod, string>;

export function describeExpiryBadge(daysLeft: number): {
  tone: ChipTone;
  label: string;
} {
  if (daysLeft < 0) {
    return { tone: "primary", label: `${Math.abs(daysLeft)}일 지남` };
  }

  if (daysLeft === 0) {
    return { tone: "highlight", label: "오늘까지" };
  }

  return {
    tone: daysLeft <= 3 ? "highlight" : "neutral",
    label: `D-${daysLeft}`,
  };
}

export function describeExpiryHelper(item: HomeAttentionItem): string {
  const storage = storageLabels[item.storage];
  const quantity = item.quantity;

  return `${storage} · ${quantity}개`;
}
