import type { NextRequest } from "next/server";

import {
  ACCESS_TOKEN_COOKIE_NAME,
  REFRESH_TOKEN_COOKIE_NAME,
} from "@/shared/api";

function readJwtSubject(token: string): string | null {
  const payload = token.split(".")[1];
  if (!payload) {
    return null;
  }

  try {
    const claims: unknown = JSON.parse(
      Buffer.from(payload, "base64url").toString("utf8"),
    );
    if (typeof claims !== "object" || claims === null) {
      return null;
    }

    const subject =
      (claims as Record<string, unknown>).sub ??
      (claims as Record<string, unknown>).userId;
    return typeof subject === "string" || typeof subject === "number"
      ? String(subject)
      : null;
  } catch {
    return null;
  }
}

export type SessionUser = {
  hasSession: boolean;
  userId: string | null;
};

// Next.js는 세션 서명 키를 갖지 않으므로 서명을 검증하지 않고 식별용으로만 읽는다.
// 만료된 accessToken이어도 sub는 같으므로 refreshToken까지 순서대로 확인한다.
export function readSessionUser(request: NextRequest): SessionUser {
  const tokens = [ACCESS_TOKEN_COOKIE_NAME, REFRESH_TOKEN_COOKIE_NAME]
    .map((name) => request.cookies.get(name)?.value)
    .filter((value): value is string => Boolean(value));

  for (const token of tokens) {
    const userId = readJwtSubject(token);
    if (userId) {
      return { hasSession: true, userId };
    }
  }

  return { hasSession: tokens.length > 0, userId: null };
}
