import { queryOptions } from "@tanstack/react-query";

import { ApiError } from "@/shared/api";

import {
  getCurrentRefrigerators,
  type RefrigeratorStatus,
} from "./get-current-refrigerators";
import { getRefrigeratorMembers } from "./get-refrigerator-members";

export const refrigeratorQueries = {
  all: () => ["refrigerators"] as const,
  current: (status: RefrigeratorStatus = "ACTIVE") =>
    queryOptions({
      queryKey: [...refrigeratorQueries.all(), "current", status] as const,
      queryFn: ({ signal }) => getCurrentRefrigerators({ status, signal }),
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
};
