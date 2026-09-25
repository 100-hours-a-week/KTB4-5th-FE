import { ApiError, SessionExpiredError } from "@/shared/api";

export function getDisposeExpiredErrorMessage(error: unknown): string | null {
  if (error instanceof SessionExpiredError) return null;

  if (error instanceof ApiError) {
    switch (error.status) {
      case 400:
        return "선택한 재료를 다시 확인해 주세요";
      case 403:
        return error.code === "COMMON-403-CSRF-001"
          ? "보안 인증에 실패했어요. 다시 시도해 주세요"
          : "냉장고 접근 권한을 확인해 주세요";
      case 404:
        return "냉장고를 찾을 수 없어요. 다시 확인해 주세요";
    }
  }

  if (error instanceof TypeError) return "인터넷 연결을 확인해 주세요";
  return "잠시 후 다시 시도해 주세요";
}
