import type { ApiProblem } from "./contract";

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly problem: ApiProblem;

  constructor(status: number, problem: ApiProblem) {
    super(problem.detail || problem.title || "API 요청에 실패했습니다.");

    this.name = "ApiError";
    this.status = status;
    this.code = problem.code;
    this.problem = problem;
  }
}
