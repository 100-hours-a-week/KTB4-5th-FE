import type { NextRequest } from "next/server";

import { parseIngredientListQuery } from "@/entities/ingredient";
import {
  canGetIngredientListOnServer,
  getAllIngredientListOnServer,
} from "@/entities/ingredient/index.server";
import { ACCESS_TOKEN_COOKIE_NAME, ApiError } from "@/shared/api";

const PROBLEM_HEADERS = { "Content-Type": "application/problem+json" };
const REFRIGERATOR_ID_PATTERN = /^[1-9]\d{0,18}$/;
const EXPIRED_INGREDIENTS_TIMEOUT_MS = 10_000;

function problem(status: number, code: string, title: string) {
  return Response.json(
    { type: "about:blank", title, status, code },
    { status, headers: PROBLEM_HEADERS },
  );
}

export async function getExpiredIngredients(
  request: NextRequest,
  refrigeratorId: string,
): Promise<Response> {
  if (!REFRIGERATOR_ID_PATTERN.test(refrigeratorId)) {
    return problem(400, "GLOBAL-400-001", "요청 형식이 올바르지 않습니다.");
  }
  if (!request.cookies.has(ACCESS_TOKEN_COOKIE_NAME)) {
    return problem(401, "GLOBAL-401-001", "로그인이 필요합니다.");
  }

  const query = {
    ...parseIngredientListQuery(
      Object.fromEntries(request.nextUrl.searchParams),
    ),
    filter: "EXPIRED" as const,
  };

  try {
    if (!canGetIngredientListOnServer()) {
      throw new TypeError("BACKEND_ORIGIN이 설정되지 않았습니다.");
    }

    return Response.json(
      await getAllIngredientListOnServer({
        refrigeratorId,
        query,
        cookie: request.headers.get("cookie") ?? "",
        signal: AbortSignal.any([
          request.signal,
          AbortSignal.timeout(EXPIRED_INGREDIENTS_TIMEOUT_MS),
        ]),
      }),
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    if (error instanceof ApiError) {
      return Response.json(error.problem, {
        status: error.status,
        headers: PROBLEM_HEADERS,
      });
    }
    return problem(
      500,
      "GLOBAL-500-001",
      "서버에서 요청을 처리하지 못했습니다.",
    );
  }
}
