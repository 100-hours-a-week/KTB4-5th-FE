import { ApiError, SessionExpiredError } from "@/shared/api";

export type IngredientReadResource = "detail" | "list";

type IngredientReadErrorPresentation = {
  title: string;
  description?: string;
  action: "retry" | "refrigerator" | "login" | "redirecting";
};

export function getIngredientReadError(
  error: unknown,
  resource: IngredientReadResource,
): IngredientReadErrorPresentation {
  if (error instanceof SessionExpiredError) {
    return {
      title: "로그인 화면으로 이동하는 중입니다",
      action: "redirecting",
    };
  }

  if (error instanceof ApiError) {
    if (error.status === 401) {
      return {
        title: "로그인이 필요해요",
        description: "다시 로그인해 주세요",
        action: "login",
      };
    }

    if (error.status === 403) {
      return {
        title:
          resource === "detail"
            ? "이 재고에 접근할 권한이 없어요"
            : "이 냉장고에 접근할 권한이 없어요",
        description: "냉장고에서 접근 가능한 재고를 확인해 주세요",
        action: "refrigerator",
      };
    }

    if (error.status === 404) {
      return {
        title:
          resource === "detail"
            ? "재고를 찾을 수 없어요"
            : "냉장고를 찾을 수 없어요",
        description: "냉장고에서 재고 목록을 확인해 주세요",
        action: "refrigerator",
      };
    }

    if (error.status >= 500) {
      return {
        title: "서버 오류로 재고를 불러오지 못했어요",
        description: "잠시 후 다시 시도해 주세요",
        action: "retry",
      };
    }
  }

  if (error instanceof TypeError) {
    return {
      title: "네트워크 연결을 확인해 주세요",
      description: "연결을 확인한 뒤 다시 시도해 주세요",
      action: "retry",
    };
  }

  return {
    title: "재고를 불러오지 못했어요",
    description: "잠시 후 다시 시도해 주세요",
    action: "retry",
  };
}
