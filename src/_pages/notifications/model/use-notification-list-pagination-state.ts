"use client";

import { hashKey, useQueryClient, type QueryKey } from "@tanstack/react-query";
import {
  useCallback,
  useEffect,
  useRef,
  type RefObject,
  type UIEvent,
} from "react";

const scrollPositions = new Map<string, number>();

type NotificationListPaginationState = {
  scrollContainerRef: RefObject<HTMLElement | null>;
  handleScroll: (event: UIEvent<HTMLElement>) => void;
};

export function useNotificationListPaginationState(
  queryKey: QueryKey,
): NotificationListPaginationState {
  const queryClient = useQueryClient();
  const scrollContainerRef = useRef<HTMLElement>(null);
  const scrollKey = hashKey(queryKey);
  const previousScrollKey = useRef(scrollKey);

  useEffect(() => {
    if (previousScrollKey.current !== scrollKey) {
      scrollPositions.delete(scrollKey);
      void queryClient.resetQueries({ queryKey, exact: true });
      previousScrollKey.current = scrollKey;
    }

    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop =
        scrollPositions.get(scrollKey) ?? 0;
    }
  }, [queryClient, queryKey, scrollKey]);

  const handleScroll = useCallback(
    (event: UIEvent<HTMLElement>) => {
      scrollPositions.set(scrollKey, event.currentTarget.scrollTop);
    },
    [scrollKey],
  );

  return { scrollContainerRef, handleScroll };
}
