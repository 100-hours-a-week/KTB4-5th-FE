import { API_BASE_PATH } from "@/shared/api";

export type OAuthProvider = "kakao";

export function getOAuthAuthorizationPath(provider: OAuthProvider): string {
  return `${API_BASE_PATH}/auth/oauth/${provider}`;
}
