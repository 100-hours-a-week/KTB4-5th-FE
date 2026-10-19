import { expect, it } from "vitest";
import type { ImageAnalysisListItem } from "@/entities/image";

import { selectAnalysisBanner } from "./select-analysis-banner";

const job: ImageAnalysisListItem = {
  analysisId: "new",
  status: "PROCESSING",
  submittedAt: "2026-10-16T10:00:00Z",
  expiresAt: null,
  pollAfterMs: 1000,
  totalImageCount: 3,
  completedImageCount: 1,
  failedImageCount: 1,
  images: [],
  error: null,
};
const now = Date.parse("2026-10-16T12:00:00Z");

it("hides empty, expired, and registered jobs and otherwise keeps server order", () => {
  expect(selectAnalysisBanner([], now)).toBeUndefined();
  const expired = {
    ...job,
    analysisId: "expired",
    expiresAt: "2026-10-16T12:00:00Z",
  };
  expect(selectAnalysisBanner([expired], now)).toBeUndefined();
  expect(selectAnalysisBanner([expired, job], now)).toBe(job);
  expect(selectAnalysisBanner([job], now, ["new"])).toBeUndefined();
  const older = { ...job, analysisId: "older" };
  expect(selectAnalysisBanner([job, older], now)).toBe(job);
  expect(selectAnalysisBanner([job, older], now, ["new"])).toBe(older);
});
