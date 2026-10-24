import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from "@tanstack/react-query";
import { cookies } from "next/headers";
import { preload } from "react-dom";

import {
  INGREDIENT_LIST_FILTERS,
  ingredientQueries,
  parseIngredientListQuery,
  toIngredientListEarlyFetchScript,
  toIngredientListPath,
  type RawQueryParams,
} from "@/entities/ingredient";
import {
  canGetIngredientListOnServer,
  getIngredientListOnServer,
} from "@/entities/ingredient/index.server";
import { CURRENT_REFRIGERATOR_COOKIE_NAME } from "@/entities/refrigerator/index.server";
import { ACCESS_TOKEN_COOKIE_NAME, API_BASE_PATH } from "@/shared/api";

import { IngredientListEarlyFetch } from "./ingredient-list-early-fetch";
import { RefrigeratorPage } from "./refrigerator-page";

type RefrigeratorServerPageProps = {
  queryParams: RawQueryParams;
};

export async function RefrigeratorServerPage({
  queryParams,
}: RefrigeratorServerPageProps) {
  const cookieStore = await cookies();
  const refrigeratorId =
    cookieStore.get(CURRENT_REFRIGERATOR_COOKIE_NAME)?.value || undefined;
  const queryClient = new QueryClient();
  const query = parseIngredientListQuery(queryParams);
  const hasSession = cookieStore.has(ACCESS_TOKEN_COOKIE_NAME);
  const earlyFetchPaths =
    refrigeratorId && hasSession && !query.keyword
      ? [null, ...INGREDIENT_LIST_FILTERS]
          .filter((filter) => filter !== query.filter)
          .map((filter) =>
            toIngredientListPath(refrigeratorId, { ...query, filter }),
          )
      : [];

  for (const path of earlyFetchPaths) {
    preload(`${API_BASE_PATH}${path}`, {
      as: "fetch",
      crossOrigin: "use-credentials",
      fetchPriority: "low",
    });
  }

  if (refrigeratorId && hasSession && canGetIngredientListOnServer()) {
    await queryClient.prefetchInfiniteQuery({
      ...ingredientQueries.list(refrigeratorId, query),
      retry: false,
      queryFn: () =>
        getIngredientListOnServer({
          refrigeratorId,
          query,
          cookie: cookieStore.toString(),
        }),
    });
  }

  return (
    <>
      {earlyFetchPaths.length > 0 && (
        <IngredientListEarlyFetch
          script={toIngredientListEarlyFetchScript(earlyFetchPaths)}
        />
      )}
      <HydrationBoundary state={dehydrate(queryClient)}>
        <RefrigeratorPage initialRefrigeratorId={refrigeratorId} />
      </HydrationBoundary>
    </>
  );
}
