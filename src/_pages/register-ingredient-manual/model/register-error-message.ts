import { ApiError, SessionExpiredError } from "@/shared/api";

const DEFAULT_REGISTER_ERROR_MESSAGE = "재고 등록에 실패했어요";
const NETWORK_ERROR_MESSAGE = "인터넷 연결을 확인해 주세요";

const REGISTER_ERROR_MESSAGES = {
  400: "등록한 재료 입력값을 다시 확인해 주세요",
  401: "로그인이 필요해요",
  403: "냉장고 접근 권한을 확인해 주세요",
  404: "존재하지 않는 냉장고예요",
  409: "냉장고 용량 또는 재고 합산 한도를 확인해 주세요",
  422: "사용할 수 없는 재료 이름이 포함돼 있어요",
} satisfies Partial<Record<number, string>>;

export function getRegisterErrorMessage(error: unknown): string | null {
  if (error instanceof SessionExpiredError) {
    return null;
  }

  if (error instanceof ApiError) {
    return (
      REGISTER_ERROR_MESSAGES[
        error.status as keyof typeof REGISTER_ERROR_MESSAGES
      ] ?? DEFAULT_REGISTER_ERROR_MESSAGE
    );
  }

  if (error instanceof TypeError) {
    return NETWORK_ERROR_MESSAGE;
  }

  return DEFAULT_REGISTER_ERROR_MESSAGE;
}
