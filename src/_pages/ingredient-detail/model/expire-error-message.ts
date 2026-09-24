import { ApiError, SessionExpiredError } from "@/shared/api";

export function getExpireErrorMessage(error: unknown): string | null {
  if (error instanceof SessionExpiredError) return null;

  if (error instanceof ApiError) {
    switch (error.status) {
      case 400:
      case 422:
        return "처리할 재고 값을 확인해 주세요";
      case 403:
        return error.code === "COMMON-403-CSRF-001"
          ? "보안 인증에 실패했어요. 다시 시도해 주세요"
          : "냉장고 접근 권한을 확인해 주세요";
      case 404:
        return "재고를 찾을 수 없어요. 목록을 다시 확인해 주세요";
      case 412:
        return "다른 곳에서 수정됐어요. 최신 재고를 확인해 주세요";
      case 428:
        return "재고 버전 정보가 없어요. 다시 불러와 주세요";
    }
  }

  if (error instanceof TypeError) return "인터넷 연결을 확인해 주세요";
  return "잠시 후 다시 시도해 주세요";
}
