import { requestJson, requestNoContent } from "@/shared/api";

const INVITE_CODE_TTL_MS = 24 * 60 * 60 * 1000;

type InviteCodeDto = {
  code: string;
};

type LeaveRefrigeratorDto = {
  activeRefrigeratorIds: (string | number)[];
};

type JoinRefrigeratorDto = {
  refrigeratorId: string | number;
};

export type InviteCode = {
  code: string;
  expiresAt: string;
};

const membersPath = (refrigeratorId: string) =>
  `/refrigerators/${encodeURIComponent(refrigeratorId)}/members`;

export async function createInviteCode(
  refrigeratorId: string,
): Promise<InviteCode> {
  const { data } = await requestJson<InviteCodeDto>(
    `/refrigerators/${encodeURIComponent(refrigeratorId)}/invitations`,
    { method: "POST" },
  );

  return {
    code: data.code,
    expiresAt: new Date(Date.now() + INVITE_CODE_TTL_MS).toISOString(),
  };
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
