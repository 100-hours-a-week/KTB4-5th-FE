import type { ApiProblem, ApiResponse } from "./contract";

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function isApiResponse(value: unknown): value is ApiResponse<unknown> {
  return (
    isRecord(value) &&
    typeof value.code === "string" &&
    typeof value.message === "string" &&
    Object.hasOwn(value, "data")
  );
}

function readNonEmptyString(value: unknown): string | null {
  return typeof value === "string" && value ? value : null;
}

export async function readProblem(response: Response): Promise<ApiProblem> {
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
    code: readNonEmptyString(problem.code) ?? `UNKNOWN-${response.status}-000`,
    title:
      readNonEmptyString(problem.title) ??
      readNonEmptyString(problem.message) ??
      readNonEmptyString(response.statusText) ??
      `HTTP ${response.status} 오류`,
    status: response.status,
    type: typeof problem.type === "string" ? problem.type : "about:blank",
    detail: typeof problem.detail === "string" ? problem.detail : undefined,
    instance:
      typeof problem.instance === "string" ? problem.instance : undefined,
  };
}
