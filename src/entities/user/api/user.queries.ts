import { queryOptions } from "@tanstack/react-query";

import { getMe } from "./get-me";

export const userQueries = {
  me: () =>
    queryOptions({
      queryKey: ["users", "me"] as const,
      queryFn: ({ signal }) => getMe(signal),
      staleTime: Infinity,
    }),
};
