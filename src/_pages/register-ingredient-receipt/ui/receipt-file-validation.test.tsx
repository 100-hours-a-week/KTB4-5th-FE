// @vitest-environment jsdom
import { cleanup, fireEvent, render } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { RegisterIngredientReceiptPage } from "./register-ingredient-receipt-page";
vi.mock("@lineiconshq/free-icons", () => ({
  XmarkOutlined: {},
  CameraOutlined: {},
  CalendarDaysOutlined: {},
}));
vi.mock("@lineiconshq/react-lineicons", () => ({ Lineicons: () => null }));
const { addPhoto, toast } = vi.hoisted(() => ({
  addPhoto: vi.fn(),
  toast: vi.fn(),
}));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));
vi.mock("@/shared/ui/app-toast", () => ({ showAppToast: toast }));
vi.mock("@/shared/ui/app-dialog", () => ({ AppDialog: () => null }));
vi.mock("@/features/ingredient-form", () => ({
  useFormLeaveGuard: () => ({ open: false }),
}));
vi.mock("../model/use-receipt-analysis", () => ({
  useReceiptAnalysis: () => ({
    isAnalyzing: false,
    failure: null,
    uncheckedResult: null,
  }),
}));
vi.mock("../model/use-receipt-photos", () => ({
  RECEIPT_PHOTO_LIMIT: 5,
  RECEIPT_PHOTO_MAX_BYTES: 10 * 1024 * 1024,
  RECEIPT_PHOTO_TYPES: ["image/jpeg", "image/png", "image/webp"],
  useReceiptPhotos: () => ({
    photos: [],
    isFull: false,
    shownIndex: -1,
    addPhoto,
  }),
}));
beforeEach(() => vi.clearAllMocks());
afterEach(cleanup);
it("빈 사진을 미리보기에 추가하지 않고 바로 안내한다", () => {
  const { container } = render(<RegisterIngredientReceiptPage />);
  fireEvent.change(container.querySelector('input[type="file"]')!, {
    target: { files: [new File([], "empty.jpg", { type: "image/jpeg" })] },
  });
  expect(addPhoto).not.toHaveBeenCalled();
  expect(toast).toHaveBeenCalledWith(
    expect.objectContaining({ message: "내용이 없는 사진은 올릴 수 없어요" }),
  );
});
it("유효한 크기의 사진은 기존 경로로 추가한다", () => {
  const { container } = render(<RegisterIngredientReceiptPage />);
  const file = new File(["image"], "receipt.jpg", { type: "image/jpeg" });
  fireEvent.change(container.querySelector('input[type="file"]')!, {
    target: { files: [file] },
  });
  expect(addPhoto).toHaveBeenCalledWith(file);
});
