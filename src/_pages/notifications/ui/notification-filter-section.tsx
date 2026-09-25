"use client";

import {
  NOTIFICATION_LIST_FILTER_LABELS,
  NOTIFICATION_LIST_FILTERS,
  type NotificationListFilter,
} from "@/entities/notification";
import { FilterChip } from "@/shared/ui/filter-chip";

import { useNotificationListNavigation } from "../model/use-notification-list-navigation";

type NotificationFilterSectionProps = {
  filter: NotificationListFilter;
};

export function NotificationFilterSection({
  filter,
}: NotificationFilterSectionProps) {
  const changeFilter = useNotificationListNavigation();

  return (
    <div
      role="group"
      aria-label="알림 필터"
      className="flex items-center gap-1.5 overflow-x-auto [-webkit-overflow-scrolling:touch] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      {NOTIFICATION_LIST_FILTERS.map((value) => (
        <FilterChip
          key={value}
          selected={filter === value}
          onClick={() => {
            if (filter !== value) changeFilter(value);
          }}
        >
          {NOTIFICATION_LIST_FILTER_LABELS[value]}
        </FilterChip>
      ))}
    </div>
  );
}
