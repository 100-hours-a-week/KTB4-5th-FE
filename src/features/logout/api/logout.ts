import { requestJson } from "@/shared/api";

export function logout() {
  return requestJson<null>("/auth/sessions", { method: "DELETE" });
}
