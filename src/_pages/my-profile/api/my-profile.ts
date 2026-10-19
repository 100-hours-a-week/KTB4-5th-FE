import { requestJson } from "@/shared/api";

type UpdateMyProfileRequest = {
  nickname: string;
  profileImage?: string | null;
};

type UpdateMyProfileResponse = {
  userId: string;
  nickname: string;
  profileImageUrl: string | null;
};

export function updateMyProfile(body: UpdateMyProfileRequest) {
  return requestJson<UpdateMyProfileResponse>("/users/me", {
    method: "PATCH",
    json: body,
  });
}
