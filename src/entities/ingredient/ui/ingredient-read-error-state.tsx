import { routes } from "@/shared/routes";
import { AppLink } from "@/shared/ui/app-link";
import {
  AsyncViewState,
  asyncViewActionClassName,
} from "@/shared/ui/async-view-state";

import {
  getIngredientReadError,
  type IngredientReadResource,
} from "../model/ingredient-read-error";

type IngredientReadErrorStateProps = {
  error: unknown;
  resource: IngredientReadResource;
  isFetching: boolean;
  failureCount: number;
  cooldownSeconds: number;
  onRetry: () => void;
};

export function IngredientReadErrorState({
  error,
  resource,
  isFetching,
  failureCount,
  cooldownSeconds,
  onRetry,
}: IngredientReadErrorStateProps) {
  const { title, description, action } = getIngredientReadError(
    error,
    resource,
  );

  if (action === "redirecting") {
    return <AsyncViewState status="loading" title={title} />;
  }

  const retryDescription =
    action === "retry" && failureCount >= 3
      ? "잠시 후 다시 시도해 주세요"
      : description;
  const actionNode =
    action === "retry" ? (
      <button
        type="button"
        onClick={onRetry}
        disabled={isFetching || cooldownSeconds > 0}
        aria-busy={isFetching}
        className={asyncViewActionClassName}
      >
        {isFetching
          ? "로딩 중"
          : cooldownSeconds > 0
            ? `${cooldownSeconds}초 후 다시 시도`
            : "다시 시도"}
      </button>
    ) : (
      <AppLink
        href={action === "login" ? routes.login : routes.refrigerator}
        className={asyncViewActionClassName}
      >
        {action === "login" ? "로그인으로 이동" : "냉장고로 이동"}
      </AppLink>
    );

  return (
    <AsyncViewState
      status="error"
      title={title}
      description={retryDescription}
      action={actionNode}
    />
  );
}
