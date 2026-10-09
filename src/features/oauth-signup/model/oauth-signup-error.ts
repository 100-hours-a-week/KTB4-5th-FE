import { ApiError } from "@/shared/api";
import {
  loginRedirectReasons,
  type LoginRedirectReason,
} from "@/shared/routes";

export type OAuthSignupError =
  | { kind: "nickname"; message: string }
  | { kind: "restart"; reason: LoginRedirectReason }
  | { kind: "retry"; message: string };

const RETRY_MESSAGE = "잠시 후 다시 시도해 주세요";

export function getOAuthSignupError(error: unknown): OAuthSignupError {
  if (!(error instanceof ApiError)) {
    return {
      kind: "retry",
      message:
        error instanceof TypeError
          ? "인터넷 연결을 확인해 주세요"
          : RETRY_MESSAGE,
    };
  }

  switch (error.code) {
    case "USER-409-001":
      return { kind: "nickname", message: "이미 사용 중이에요" };
    case "USER-422-001":
      return {
        kind: "nickname",
        message: "사용할 수 없는 단어가 포함돼 있어요",
      };
    case "USER-400-001":
      return { kind: "restart", reason: loginRedirectReasons.signupExpired };
    case "USER-409-004":
      return {
        kind: "restart",
        reason: loginRedirectReasons.alreadyRegistered,
      };
    case "USER-409-003":
      return { kind: "retry", message: "이미 가입된 이메일이에요" };
    default:
      return { kind: "retry", message: RETRY_MESSAGE };
  }
}
