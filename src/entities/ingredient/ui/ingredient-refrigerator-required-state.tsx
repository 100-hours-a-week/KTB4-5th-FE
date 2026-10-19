import { AsyncViewState } from "@/shared/ui/async-view-state";

export function IngredientRefrigeratorRequiredState() {
  return (
    <AsyncViewState
      status="error"
      title="사용 중인 냉장고가 없어요"
      description="냉장고에 참여하면 재고를 확인할 수 있어요"
    />
  );
}
