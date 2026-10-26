import type { NextRequest } from "next/server";

import { parseIngredientListQuery } from "@/entities/ingredient";
import {
  canGetIngredientListOnServer,
  getAllIngredientListOnServer,
} from "@/entities/ingredient/index.server";
import { ApiError } from "@/shared/api";

const PROBLEM_HEADERS = { "Content-Type": "application/problem+json" };

export async function getExpiredIngredients(
  request: NextRequest,
  refrigeratorId: string,
): Promise<Response> {
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
        signal: request.signal,
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
    return Response.json(
      {
        type: "about:blank",
        title: "서버에서 요청을 처리하지 못했습니다.",
        status: 500,
        code: "GLOBAL-500-001",
      },
      { status: 500, headers: PROBLEM_HEADERS },
    );
  }
}
