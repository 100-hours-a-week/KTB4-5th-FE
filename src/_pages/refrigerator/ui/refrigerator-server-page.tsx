import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from "@tanstack/react-query";
import { cookies } from "next/headers";

import {
  ingredientQueries,
  parseIngredientListQuery,
  type RawQueryParams,
} from "@/entities/ingredient";
import {
  canGetIngredientListOnServer,
  getIngredientListOnServer,
} from "@/entities/ingredient/index.server";
import { CURRENT_REFRIGERATOR_COOKIE_NAME } from "@/entities/refrigerator/index.server";
import { ACCESS_TOKEN_COOKIE_NAME } from "@/shared/api";

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

  if (
    refrigeratorId &&
    cookieStore.has(ACCESS_TOKEN_COOKIE_NAME) &&
    canGetIngredientListOnServer()
  ) {
    const query = parseIngredientListQuery(queryParams);
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
    <HydrationBoundary state={dehydrate(queryClient)}>
      <RefrigeratorPage initialRefrigeratorId={refrigeratorId} />
    </HydrationBoundary>
  );
}
