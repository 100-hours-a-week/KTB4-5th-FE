import { routes } from "@/shared/routes";
import { AppLink } from "@/shared/ui/app-link";
import {
  AsyncViewState,
  asyncViewActionClassName,
} from "@/shared/ui/async-view-state";

export function IngredientRefrigeratorRequiredState() {
  return (
    <AsyncViewState
      status="error"
      title="냉장고를 선택해 주세요"
      description="재고를 조회할 냉장고가 선택되지 않았어요"
      action={
        <AppLink
          href={routes.refrigerator}
          className={asyncViewActionClassName}
        >
          냉장고로 이동
        </AppLink>
      }
    />
  );
}
