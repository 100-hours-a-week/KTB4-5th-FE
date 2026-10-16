import { queryOptions } from "@tanstack/react-query";

import { ApiError } from "@/shared/api";

import { getCurrentRefrigerators } from "./get-current-refrigerators";
import { getInvitation } from "./get-invitation";
import { getRefrigeratorMembers } from "./get-refrigerator-members";

export const refrigeratorQueries = {
  all: () => ["refrigerators"] as const,
  current: () =>
    queryOptions({
      queryKey: [...refrigeratorQueries.all(), "current"] as const,
      queryFn: ({ signal }) => getCurrentRefrigerators({ signal }),
      retry: (failureCount, error) =>
        !(error instanceof ApiError && error.status === 401) &&
        failureCount < 2,
    }),
  members: (refrigeratorId: string) =>
    queryOptions({
      queryKey: [
        ...refrigeratorQueries.all(),
        refrigeratorId,
        "members",
      ] as const,
      queryFn: ({ signal }) =>
        getRefrigeratorMembers({ refrigeratorId, signal }),
    }),
  invitation: (refrigeratorId: string) =>
    queryOptions({
      queryKey: [
        ...refrigeratorQueries.all(),
        refrigeratorId,
        "invitation",
      ] as const,
      queryFn: ({ signal }) => getInvitation({ refrigeratorId, signal }),
    }),
};
