import { requestJson } from "@/shared/api";

type MeDto = {
  userId: string | number;
  nickname: string;
  email?: string | null;
  profileImageUrl?: string | null;
  cookingCount: number;
};

export type Me = {
  userId: string;
  nickname: string;
  email: string | null;
  profileImageUrl: string | null;
  cookingCount: number;
};

export async function getMe(signal?: AbortSignal): Promise<Me> {
  const { data } = await requestJson<MeDto>("/users/me", { signal });

  return {
    userId: String(data.userId),
    nickname: data.nickname,
    email: data.email ?? null,
    profileImageUrl: data.profileImageUrl ?? null,
    cookingCount: data.cookingCount,
  };
}
