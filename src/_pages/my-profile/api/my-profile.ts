import { requestJson, requestNoContent } from "@/shared/api";

export type UpdateMyProfileRequest = {
  nickname: string;
  profileImage?: string | null;
};

type UpdateMyProfileResponse = {
  userId: string | number;
  nickname: string;
  profileImageUrl: string | null;
};

export function updateMyProfile(request: UpdateMyProfileRequest) {
  return requestJson<UpdateMyProfileResponse>("/users/me", {
    method: "PATCH",
    json: request,
  });
}

export function withdrawAccount() {
  return requestNoContent("/users/me", { method: "DELETE" });
}
