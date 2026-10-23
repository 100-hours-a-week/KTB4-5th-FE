import { z } from "zod";

import { requestJson } from "@/shared/api";

const nicknameValidationSchema = z.object({
  valid: z.boolean(),
  reason: z.string().nullable(),
});

export async function validateNickname(nickname: string) {
  const { data } = await requestJson<unknown>("/users/nickname-validations", {
    method: "POST",
    json: { nickname },
  });
  return nicknameValidationSchema.parse(data);
}
