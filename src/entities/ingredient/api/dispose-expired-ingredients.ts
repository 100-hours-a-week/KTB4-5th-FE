import { requestNoContent } from "@/shared/api";

type DisposeExpiredIngredientsParams = {
  refrigeratorId: string;
  ingredientIds: string[];
};

/**
 * 선택한 만료 재고를 삭제한다. 서버는 실행 시점에 만료(D-0 제외)인 재고만 지우고,
 * 삭제 대상이 0건이어도 204를 돌려준다. 되돌리기는 없다.
 */
export function disposeExpiredIngredients({
  refrigeratorId,
  ingredientIds,
}: DisposeExpiredIngredientsParams): Promise<void> {
  return requestNoContent(
    `/refrigerators/${encodeURIComponent(refrigeratorId)}/ingredients/expired`,
    {
      method: "DELETE",
      // API 명세의 재고 ID는 숫자이므로 요청 경계에서 변환한다.
      json: { ingredientIds: ingredientIds.map(Number) },
    },
  );
}
