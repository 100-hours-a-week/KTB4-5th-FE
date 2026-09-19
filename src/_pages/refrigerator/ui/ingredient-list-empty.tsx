import { routes } from "@/shared/routes";
import { AppLink } from "@/shared/ui/app-link";
import { AsyncViewState } from "@/shared/ui/async-view-state";

type IngredientListEmptyProps = {
  /** 사용자가 고른 필터가 있는 상태인지. 문구와 액션을 가른다. */
  hasCondition: boolean;
  onResetCondition: () => void;
};

// AppLink는 `a`, 조건 초기화는 `button`이라 공통 Button을 쓸 수 없어 표현만 맞춘다.
const actionClassName =
  "inline-flex min-h-12 items-center justify-center rounded-full bg-app-ink px-6 text-[14px] font-black text-app-canvas no-underline hover:bg-app-neutral-800";

export function IngredientListEmpty({
  hasCondition,
  onResetCondition,
}: IngredientListEmptyProps) {
  if (hasCondition) {
    return (
      <AsyncViewState
        status="empty"
        title="조건에 맞는 재료가 없어요"
        description="필터를 바꾸면 다른 재료를 찾을 수 있어요"
        action={
          <button
            type="button"
            onClick={onResetCondition}
            className={actionClassName}
          >
            전체 보기
          </button>
        }
      />
    );
  }

  return (
    <AsyncViewState
      status="empty"
      title="냉장고가 비어 있어요"
      description="재료를 등록하면 유효기간을 대신 챙겨드릴게요"
      action={
        <AppLink href={routes.registerIngredient} className={actionClassName}>
          재료 등록하기
        </AppLink>
      }
    />
  );
}
