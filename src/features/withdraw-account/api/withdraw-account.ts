import { requestNoContent } from "@/shared/api";

export function withdrawAccount() {
  return requestNoContent("/users/me", { method: "DELETE" });
}
