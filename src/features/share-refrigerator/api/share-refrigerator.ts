import { requestJson, requestNoContent } from "@/shared/api";

type InviteCodeDto = {
  code: string;
};

type LeaveRefrigeratorDto = {
  activeRefrigeratorIds: (string | number)[];
};

type JoinRefrigeratorDto = {
  refrigeratorId: string | number;
};

const membersPath = (refrigeratorId: string) =>
  `/refrigerators/${encodeURIComponent(refrigeratorId)}/members`;

export async function createInviteCode(
  refrigeratorId: string,
): Promise<string> {
  const { data } = await requestJson<InviteCodeDto>(
    `/refrigerators/${encodeURIComponent(refrigeratorId)}/invitations`,
    { method: "POST" },
  );

  return data.code;
}

export async function joinRefrigerator(inviteCode: string): Promise<string> {
  const { data } = await requestJson<JoinRefrigeratorDto>(
    "/refrigerators/members",
    { method: "POST", json: { inviteCode } },
  );

  return String(data.refrigeratorId);
}

export async function removeRefrigeratorMember({
  refrigeratorId,
  userId,
}: {
  refrigeratorId: string;
  userId: string;
}): Promise<void> {
  await requestNoContent(
    `${membersPath(refrigeratorId)}/${encodeURIComponent(userId)}`,
    { method: "DELETE" },
  );
}

export async function leaveRefrigerator(
  refrigeratorId: string,
): Promise<string | null> {
  const { data } = await requestJson<LeaveRefrigeratorDto>(
    `${membersPath(refrigeratorId)}/me`,
    { method: "DELETE" },
  );
  const [nextRefrigeratorId] = data.activeRefrigeratorIds ?? [];

  return nextRefrigeratorId === undefined ? null : String(nextRefrigeratorId);
}
