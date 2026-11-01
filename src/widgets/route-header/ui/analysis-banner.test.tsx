import { renderToStaticMarkup } from "react-dom/server";
import { expect, it, vi } from "vitest";

vi.mock("@lineiconshq/free-icons", () => ({
  ArrowRightOutlined: {},
  HourglassOutlined: {},
  CheckCircle1Outlined: {},
  XmarkCircleOutlined: {},
}));
vi.mock("@lineiconshq/react-lineicons", () => ({ Lineicons: () => null }));

import { AnalysisBanner } from "./analysis-banner";

it("shows the supplied image progress and replaces it with the completion message", () => {
  const processing = renderToStaticMarkup(
    <AnalysisBanner status="processing" processedCount={2} totalCount={3} />,
  );
  expect(processing).toContain("사진 인식 중 · 2/3장");
  expect(processing).not.toContain("결과 확인");

  const completed = renderToStaticMarkup(<AnalysisBanner status="completed" />);
  expect(completed).toContain("인식 완료 · 결과 확인");
  expect(completed).not.toContain("2/3장");
});
