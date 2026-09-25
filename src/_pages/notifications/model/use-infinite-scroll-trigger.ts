"use client";

import { useEffect, useRef, type RefObject } from "react";

type UseInfiniteScrollTriggerParams = {
  rootRef: RefObject<HTMLElement | null>;
  enabled: boolean;
  onLoadMore: () => Promise<unknown>;
};

export function useInfiniteScrollTrigger({
  rootRef,
  enabled,
  onLoadMore,
}: UseInfiniteScrollTriggerParams): RefObject<HTMLDivElement | null> {
  const triggerRef = useRef<HTMLDivElement>(null);
  const onLoadMoreRef = useRef(onLoadMore);
  const enabledRef = useRef(enabled);

  useEffect(() => {
    onLoadMoreRef.current = onLoadMore;
    enabledRef.current = enabled;
  }, [enabled, onLoadMore]);

  useEffect(() => {
    const root = rootRef.current;
    const trigger = triggerRef.current;

    if (!enabled || !root || !trigger) return;

    let disposed = false;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;

        observer.disconnect();

        const resumeObserving = () => {
          if (!disposed && enabledRef.current) observer.observe(trigger);
        };

        void Promise.resolve()
          .then(() => onLoadMoreRef.current())
          .then(resumeObserving, resumeObserving);
      },
      { root, rootMargin: "200px" },
    );

    observer.observe(trigger);
    return () => {
      disposed = true;
      observer.disconnect();
    };
  }, [enabled, rootRef]);

  return triggerRef;
}
