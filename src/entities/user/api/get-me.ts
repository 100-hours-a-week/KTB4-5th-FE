import { requestJson } from "@/shared/api";

type MeDto = {
  userId: string | number;
  nickname: string;
};

export type Me = {
  userId: string;
  nickname: string;
};

export async function getMe(signal?: AbortSignal): Promise<Me> {
  const { data } = await requestJson<MeDto>("/users/me", { signal });

  return { userId: String(data.userId), nickname: data.nickname };
}
