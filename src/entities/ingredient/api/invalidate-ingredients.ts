import { hashKey, type QueryClient } from "@tanstack/react-query";

import { ingredientQueries } from "./ingredient.queries";

// 재고가 바뀌면 이 냉장고의 재고 캐시(목록·첫 페이지·전체·상세)를 모두 무효화하고 보이는 화면은 바로 다시 받는다.
// 삭제된 재고의 상세는 다시 받으면 404가 나므로 제외한다.
export function invalidateIngredients(
  queryClient: QueryClient,
  refrigeratorId: string,
  removedIngredientId?: string,
) {
  const queryKey = ingredientQueries.byRefrigerator(refrigeratorId);
  if (!removedIngredientId) {
    return queryClient.invalidateQueries({ queryKey });
  }

  const removedDetailHash = hashKey(
    ingredientQueries.detail(refrigeratorId, removedIngredientId).queryKey,
  );
  return queryClient.invalidateQueries({
    queryKey,
    predicate: (query) => query.queryHash !== removedDetailHash,
  });
}
