import { expect, it, vi } from "vitest";
vi.mock("@lineiconshq/free-icons", () => ({ CalendarDaysOutlined: {} }));
vi.mock("@lineiconshq/react-lineicons", () => ({ Lineicons: () => null }));
import { analysisFixture } from "@/entities/image/api/image-analysis.test-fixtures";
import { getTodayInSeoul } from "@/shared/lib/seoul-date";
import {
  getRecognitionStatus,
  toRecognitionResult,
} from "./receipt-recognition";

it("OCR 이름을 입력 규칙에 맞추고 변환한 항목은 확인 필요로 표시한다", () => {
  const analysis = structuredClone(analysisFixture);
  const item = analysis.results[0]!.items[0]!;
  item.name = "서울우유(1000ml)";
  item.expiration = getTodayInSeoul();
  item.displayStatus = "RECOGNIZED";
  const result = toRecognitionResult(analysis);
  expect(result.drafts[0]!.name).toBe("서울우유1000ml");
  expect(result.hints[0]).toBe("NEEDS_CHECK");
  expect(getRecognitionStatus(result.drafts[0]!, result.hints[0]!)).toBe(
    "NEEDS_CHECK",
  );
});

it("빈 값과 유효하지 않은 값을 정상 인식으로 표시하지 않는다", () => {
  const result = toRecognitionResult(analysisFixture);
  const draft = {
    ...result.drafts[0]!,
    name: "우유",
    expirationDate: getTodayInSeoul(),
  };
  expect(getRecognitionStatus(draft, null)).toBe("RECOGNIZED");
  expect(getRecognitionStatus({ ...draft, weightValue: "50001" }, null)).toBe(
    "NEEDS_CHECK",
  );
  expect(getRecognitionStatus({ ...draft, name: "" }, null)).toBe(
    "UNRECOGNIZED",
  );
});
