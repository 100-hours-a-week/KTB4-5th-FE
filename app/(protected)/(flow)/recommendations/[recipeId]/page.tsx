import { notFound } from "next/navigation";

import { RecipeDetailPage } from "@/_pages/recipe-detail";
import { safeDecodeURIComponent } from "@/shared/lib/decode-uri-component";

export default async function Page({
  params,
  searchParams,
}: PageProps<"/recommendations/[recipeId]">) {
  const [{ recipeId }, { recommendationId }] = await Promise.all([
    params,
    searchParams,
  ]);
  return (
    <RecipeDetailPage
      recipeId={safeDecodeURIComponent(recipeId) ?? notFound()}
      recommendationId={
        typeof recommendationId === "string" ? recommendationId : null
      }
    />
  );
}
