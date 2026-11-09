import { useVirtualizer } from "@tanstack/react-virtual";
import { memo, useEffect, useRef, useState } from "react";

import {
  formatIngredientAmount,
  type Ingredient,
  IngredientExpiryStamp,
} from "@/entities/ingredient";
import { routes } from "@/shared/routes";
import { LinkCard } from "@/shared/ui/link-card";

type IngredientCardListProps = {
  ingredients: Ingredient[];
};

export const IngredientCardList = memo(function IngredientCardList({
  ingredients,
}: IngredientCardListProps) {
  const listRef = useRef<HTMLUListElement>(null);
  const [scrollMargin, setScrollMargin] = useState(0);

  useEffect(() => {
    const list = listRef.current;
    const section = list?.closest("section");
    if (!list || !section) return;
    const resizeObserver = new ResizeObserver(() =>
      setScrollMargin(
        list.getBoundingClientRect().top -
          section.getBoundingClientRect().top +
          section.scrollTop,
      ),
    );
    const observeLayout = () => {
      resizeObserver.disconnect();
      resizeObserver.observe(section);
      for (const child of section.children) resizeObserver.observe(child);
    };
    const mutationObserver = new MutationObserver(observeLayout);
    observeLayout();
    mutationObserver.observe(section, { childList: true });
    return () => {
      resizeObserver.disconnect();
      mutationObserver.disconnect();
    };
  }, []);

  const virtualizer = useVirtualizer({
    count: ingredients.length,
    getScrollElement: () => listRef.current?.closest("section") ?? null,
    estimateSize: () => 76,
    gap: 8,
    overscan: 5,
    scrollMargin,
    getItemKey: (index) => ingredients[index].ingredientId,
  });

  return (
    <ul
      ref={listRef}
      className="relative"
      style={{ height: virtualizer.getTotalSize() }}
    >
      {virtualizer.getVirtualItems().map((item) => {
        const ingredient = ingredients[item.index];
        return (
          <li
            key={item.key}
            data-index={item.index}
            ref={virtualizer.measureElement}
            className="absolute top-0 left-0 w-full"
            style={{ transform: `translateY(${item.start - scrollMargin}px)` }}
          >
            <LinkCard
              href={routes.ingredientDetail(ingredient.ingredientId)}
              prefetch={false}
              title={ingredient.name}
              description={formatIngredientAmount(ingredient)}
              trailing={
                <IngredientExpiryStamp
                  status={ingredient.status}
                  daysUntilExpiration={ingredient.daysUntilExpiration}
                />
              }
            />
          </li>
        );
      })}
    </ul>
  );
});
