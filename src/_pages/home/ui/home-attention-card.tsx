import { routes } from "@/shared/routes";
import { AppLink } from "@/shared/ui/app-link";
import { Chip } from "@/shared/ui/chip";

import {
  describeExpiryBadge,
  describeExpiryHelper,
} from "../lib/describe-expiry";
import type { HomeAttentionItem } from "../model/home-summary";

type HomeAttentionCardProps = {
  item: HomeAttentionItem;
};

export function HomeAttentionCard({ item }: HomeAttentionCardProps) {
  const badge = describeExpiryBadge(item.daysLeft);
  const helperText = describeExpiryHelper(item);

  return (
    <AppLink
      href={routes.ingredientDetail(item.id)}
      className="flex items-center gap-3.5 rounded-[4px] bg-white px-[18px] py-4 no-underline shadow-app-sm hover:bg-app-neutral-100 active:bg-app-neutral-200"
    >
      <span className="min-w-0 flex-1">
        <span className="block truncate font-app-heading text-[18px] font-black leading-tight text-app-ink">
          {item.name}
        </span>
        <span className="mt-1 block text-[13px] leading-tight text-app-ink/55">
          {helperText}
        </span>
      </span>

      <Chip tone={badge.tone} className="flex-none">
        {badge.label}
      </Chip>
    </AppLink>
  );
}
