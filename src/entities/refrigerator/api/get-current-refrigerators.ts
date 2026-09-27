import { requestJson } from "@/shared/api";

import type { Refrigerator } from "../model/refrigerator";

type RefrigeratorResponseDto = {
  refrigeratorId: number;
  name: string;
  capacity: number;
  expiredCount: number;
};

export const REFRIGERATOR_STATUSES = ["ACTIVE", "INACTIVE"] as const;

export type RefrigeratorStatus = (typeof REFRIGERATOR_STATUSES)[number];

type GetCurrentRefrigeratorsParams = {
  status?: RefrigeratorStatus;
  signal?: AbortSignal;
};

export async function getCurrentRefrigerators({
  status = "ACTIVE",
  signal,
}: GetCurrentRefrigeratorsParams = {}): Promise<Refrigerator[]> {
  const params = new URLSearchParams({ status });
  const { data } = await requestJson<RefrigeratorResponseDto[]>(
    `/refrigerators/current?${params}`,
    { signal },
  );

  return data.map((refrigerator) => ({
    ...refrigerator,
    refrigeratorId: String(refrigerator.refrigeratorId),
  }));
}
