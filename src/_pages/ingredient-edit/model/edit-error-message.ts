import { ApiError, SessionExpiredError } from "@/shared/api";

export function getEditErrorMessage(error: unknown): string | null {
  if (error instanceof SessionExpiredError) return null;
  if (error instanceof ApiError) {
    switch (error.code) {
      case "INGREDIENT-412-001":
        return "다른 곳에서 수정됐어요. 최신 내용을 확인해 주세요";
      case "INGREDIENT-428-001":
        return "재고 버전 정보가 없어요. 다시 불러와 주세요";
      case "INGREDIENT-422-001":
        return "재료 이름을 확인해 주세요";
      case "INGREDIENT-422-002":
        return "재고 수량을 확인해 주세요";
      case "INGREDIENT-422-003":
        return "측정값과 단위를 확인해 주세요";
      case "INGREDIENT-422-004":
        return "유통기한을 확인해 주세요";
      case "INGREDIENT-400-003":
        return "입력값을 다시 확인해 주세요";
      case "REFRIGERATOR-403-001":
        return "냉장고 접근 권한을 확인해 주세요";
      case "COMMON-403-CSRF-001":
        return "보안 인증에 실패했어요. 다시 시도해 주세요";
      case "INGREDIENT-404-001":
        return "존재하지 않는 냉장고예요";
      case "GLOBAL-500-001":
        return "잠시 후 다시 시도해 주세요";
    }
  }
  if (error instanceof TypeError) return "인터넷 연결을 확인해 주세요";
  return "잠시 후 다시 시도해 주세요";
}
