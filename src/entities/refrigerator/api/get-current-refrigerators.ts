import { requestJson } from "@/shared/api";

import type { Refrigerator } from "../model/refrigerator";

type RefrigeratorResponseDto = {
  refrigeratorId: number;
  name: string;
  capacity: number;
  expiredCount: number;
};

export async function getCurrentRefrigerators({
  signal,
}: { signal?: AbortSignal } = {}): Promise<Refrigerator[]> {
  const { data } = await requestJson<RefrigeratorResponseDto[]>(
    "/refrigerators/current",
    { signal },
  );

  return data.map((refrigerator) => ({
    ...refrigerator,
    refrigeratorId: String(refrigerator.refrigeratorId),
  }));
}
