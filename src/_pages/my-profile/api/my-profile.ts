import { requestJson } from "@/shared/api";

type UpdateMyProfileResponse = {
  userId: string;
  nickname: string;
  profileImageUrl: string | null;
};

export function updateMyNickname(nickname: string) {
  return requestJson<UpdateMyProfileResponse>("/users/me", {
    method: "PATCH",
    json: { nickname },
  });
}
