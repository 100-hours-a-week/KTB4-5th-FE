import { requestJson } from "@/shared/api";

export type LoginRequest = {
  loginId: string;
  password: string;
};

export type LoginResult = {
  activeRefrigeratorIds: string[];
};

export function login(request: LoginRequest) {
  return requestJson<LoginResult>("/auth/sessions", {
    method: "POST",
    json: request,
  });
}
