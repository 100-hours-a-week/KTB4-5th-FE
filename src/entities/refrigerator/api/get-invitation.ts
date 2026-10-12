import { requestJson } from "@/shared/api";

import type { RefrigeratorInvitation } from "../model/refrigerator-invitation";

type InvitationDto = {
  code: string;
  expiresAt: string;
};

export async function getInvitation({
  refrigeratorId,
  signal,
}: {
  refrigeratorId: string;
  signal?: AbortSignal;
}): Promise<RefrigeratorInvitation | null> {
  const { data } = await requestJson<InvitationDto | null>(
    `/refrigerators/${encodeURIComponent(refrigeratorId)}/invitations`,
    { signal },
  );

  return data ? { code: data.code, expiresAt: data.expiresAt } : null;
}
