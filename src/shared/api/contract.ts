export type ApiResponse<T> = {
  code: string;
  message: string;
  data: T;
};

export type ApiProblem = {
  code: string;
  title: string;
  type?: string;
  status?: number;
  detail?: string;
  instance?: string;
  [key: string]: unknown;
};
