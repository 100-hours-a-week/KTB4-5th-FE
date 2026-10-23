import type { NextRequest } from "next/server";
import { z } from "zod";

import {
  ACCESS_TOKEN_COOKIE_NAME,
  API_BASE_PATH,
  ApiError,
  readProblem,
} from "@/shared/api";

const sessionUserResponseSchema = z.object({
  code: z.string(),
  message: z.string(),
  data: z.object({
    userId: z.union([z.string().trim().min(1), z.number().int().positive()]),
  }),
});

export async function readSessionUser(
  request: NextRequest,
): Promise<string | null> {
  if (!request.cookies.get(ACCESS_TOKEN_COOKIE_NAME)?.value) return null;

  const backendOrigin = process.env.BACKEND_ORIGIN ?? "http://localhost:8080";
  const response = await fetch(
    new URL(`${API_BASE_PATH}/users/me`, backendOrigin),
    {
      headers: {
        Accept: "application/json, application/problem+json",
        Cookie: request.headers.get("cookie") ?? "",
      },
      cache: "no-store",
      redirect: "error",
      signal: AbortSignal.any([request.signal, AbortSignal.timeout(5_000)]),
    },
  );

  if (response.status === 401 || response.status === 403) return null;
  if (!response.ok) {
    throw new ApiError(response.status, await readProblem(response));
  }

  const { data } = sessionUserResponseSchema.parse(await response.json());
  return String(data.userId);
}
