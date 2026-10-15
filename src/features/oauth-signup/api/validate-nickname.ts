import { requestJson } from "@/shared/api";

export async function validateNickname(nickname: string): Promise<void> {
  await requestJson("/users/nickname-validations", {
    method: "POST",
    json: { nickname },
  });
}
