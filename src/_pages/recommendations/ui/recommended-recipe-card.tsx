import { HatChef3Outlined, ChevronLeftOutlined } from "@lineiconshq/free-icons";
import { Lineicons } from "@lineiconshq/react-lineicons";

import { routes } from "@/shared/routes";
import { AppLink } from "@/shared/ui/app-link";

import type { RecommendedRecipe } from "@/entities/recommendation";
import Image from "next/image";

function RecipeImagePlaceholder({ className }: { className: string }) {
  return (
    <span
      aria-hidden="true"
      className={`grid flex-none place-items-center bg-app-neutral-100 text-app-neutral-400 ${className}`}
    >
      <Lineicons
        icon={HatChef3Outlined}
        size={26}
        strokeWidth={1.6}
        focusable="false"
      />
    </span>
  );
}

export function RecommendedRecipeCard({
  recipe,
  recommendationId,
}: {
  recipe: RecommendedRecipe;
  recommendationId: string | null;
}) {
  return (
    <AppLink
      href={routes.recipeDetail(recipe.recipeId, recommendationId)}
      prefetch={false}
      className="flex items-center gap-3 rounded-[4px] bg-white px-4 py-3 no-underline shadow-app-sm hover:bg-app-neutral-100 active:bg-app-neutral-200"
    >
      {recipe.imageUrl ? (
        <Image
          unoptimized
          src={recipe.imageUrl}
          alt=""
          width={60}
          height={60}
          className="size-15 flex-none rounded-[4px] object-cover"
        />
      ) : (
        <RecipeImagePlaceholder className="size-15 rounded-[4px]" />
      )}
      <span className="min-w-0 flex-1">
        <span className="block truncate font-app-heading text-[16px] font-black leading-tight text-app-ink">
          {recipe.name}
        </span>
        <span className="mt-1 flex gap-3 text-[12.5px] leading-[1.4] text-app-ink/60">
          <span>
            {recipe.ingredientCounts.owned !== null
              ? `보유 ${recipe.ingredientCounts.owned} / `
              : null}
            전체 {recipe.ingredientCounts.total}
          </span>
          {(recipe.ingredientCounts.expiring ?? 0) > 0 ? (
            <span className="font-bold text-app-ink">
              임박 {recipe.ingredientCounts.expiring}
            </span>
          ) : null}
        </span>
        {recipe.cookingTimeMinutes !== null ? (
          <span className="mt-0.5 block text-[12px] leading-tight text-app-ink/45">
            조리 {recipe.cookingTimeMinutes}분
          </span>
        ) : null}
      </span>
      <Lineicons
        icon={ChevronLeftOutlined}
        size={16}
        strokeWidth={2}
        aria-hidden="true"
        focusable="false"
        className="flex-none rotate-180 text-app-ink/35"
      />
    </AppLink>
  );
}
