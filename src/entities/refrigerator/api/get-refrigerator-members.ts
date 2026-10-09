import { requestJson } from "@/shared/api";

import type { RefrigeratorMembers } from "../model/refrigerator-member";

type RefrigeratorMemberDto = {
  userId: string;
  nickname: string;
  profileImage: string;
  role: "owner" | "member";
};

type RefrigeratorMembersDto = {
  refrigeratorName: string;
  memberNum: number;
  memberMax: number;
  members: RefrigeratorMemberDto[];
};

export async function getRefrigeratorMembers({
  refrigeratorId,
  signal,
}: {
  refrigeratorId: string;
  signal?: AbortSignal;
}): Promise<RefrigeratorMembers> {
  const { data } = await requestJson<RefrigeratorMembersDto>(
    `/refrigerators/${encodeURIComponent(refrigeratorId)}/members`,
    { signal },
  );

  return {
    refrigeratorName: data.refrigeratorName,
    memberCount: data.memberNum,
    memberMax: data.memberMax,
    members: data.members.map((member) => ({
      userId: String(member.userId),
      nickname: member.nickname,
      role: member.role,
    })),
  };
}
