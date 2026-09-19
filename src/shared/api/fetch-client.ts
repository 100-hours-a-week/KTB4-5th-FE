import { ApiError } from "./api-error";
import type { ApiProblem, ApiResponse } from "./contract";

const API_BASE_PATH = "/api/v1";

export type ApiRequestOptions = Omit<RequestInit, "body"> & {
  json?: unknown;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isApiResponse(value: unknown): value is ApiResponse<unknown> {
  return (
    isRecord(value) &&
    typeof value.code === "string" &&
    typeof value.message === "string" &&
    Object.hasOwn(value, "data")
  );
}

async function readProblem(response: Response): Promise<ApiProblem> {
  const text = await response.text();
  let value: unknown;

  try {
    value = JSON.parse(text);
  } catch {
    value = null;
  }

  const problem = isRecord(value) ? value : {};

  return {
    ...problem,
    code:
      typeof problem.code === "string" && problem.code
        ? problem.code
        : `UNKNOWN-${response.status}-000`,
    title:
      typeof problem.title === "string" && problem.title
        ? problem.title
        : response.statusText || `HTTP ${response.status} 오류`,
    status: response.status,
    type: typeof problem.type === "string" ? problem.type : "about:blank",
    detail: typeof problem.detail === "string" ? problem.detail : undefined,
    instance:
      typeof problem.instance === "string" ? problem.instance : undefined,
  };
}

async function sendRequest(
  path: string,
  { json, headers: inputHeaders, ...init }: ApiRequestOptions = {},
): Promise<Response> {
  if (!path.startsWith("/") || path.startsWith("//")) {
    throw new TypeError("API 경로는 /로 시작하는 상대 경로여야 합니다.");
  }

  const headers = new Headers(inputHeaders);
  if (!headers.has("Accept")) {
    headers.set("Accept", "application/json, application/problem+json");
  }

  let body: string | undefined;
  if (json !== undefined) {
    body = JSON.stringify(json);
    if (body === undefined) {
      throw new TypeError("요청 본문을 JSON으로 변환할 수 없습니다.");
    }
    if (!headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }
  }

  const response = await fetch(`${API_BASE_PATH}${path}`, {
    ...init,
    headers,
    body,
  });

  if (!response.ok) {
    throw new ApiError(response.status, await readProblem(response));
  }

  return response;
}

export async function requestJson<T>(
  path: string,
  options: ApiRequestOptions = {},
): Promise<ApiResponse<T>> {
  const response = await sendRequest(path, options);

  if (
    response.status === 204 ||
    response.status === 205 ||
    options.method?.toUpperCase() === "HEAD"
  ) {
    throw new TypeError("JSON 응답을 기대했지만 본문이 없습니다.");
  }

  const value: unknown = await response.json();
  if (!isApiResponse(value)) {
    throw new TypeError("API 성공 응답 형식이 올바르지 않습니다.");
  }

  return value as ApiResponse<T>;
}

export async function requestNoContent(
  path: string,
  options: ApiRequestOptions = {},
): Promise<void> {
  const response = await sendRequest(path, options);

  if (
    response.status !== 204 &&
    response.status !== 205 &&
    options.method?.toUpperCase() !== "HEAD"
  ) {
    throw new TypeError(
      "본문 없는 응답을 기대했지만 다른 성공 상태를 받았습니다.",
    );
  }
}
