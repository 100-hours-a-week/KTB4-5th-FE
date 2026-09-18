import type { UserSession } from "../model/user-session";

// TODO. 백엔드 세션 조회가 붙으면 교체 예정
export async function getUserSession(): Promise<UserSession | null> {
  return { loginId: "hyewon" };
}
