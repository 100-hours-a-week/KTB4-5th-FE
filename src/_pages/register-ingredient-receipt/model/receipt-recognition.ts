import {
  addDaysToIsoDate,
  getTodayInSeoul,
} from "@/features/select-expiration-date";
import { INGREDIENT_REGISTER_BATCH_LIMIT } from "@/shared/config";
import {
  createEmptyDraft,
  type IngredientDraft,
} from "@/widgets/ingredient-draft-form";

export type RecognitionStatus =
  "RECOGNIZED" | "AI_ESTIMATED" | "NEEDS_CHECK" | "UNRECOGNIZED";
export type RecognitionHint = "AI_ESTIMATED" | "NEEDS_CHECK" | null;

export const RECOGNITION_STATUS_LABELS = {
  RECOGNIZED: "인식",
  AI_ESTIMATED: "AI 예상",
  NEEDS_CHECK: "확인 필요",
  UNRECOGNIZED: "미인식",
} satisfies Record<RecognitionStatus, string>;

export type ReceiptRecognitionResult = {
  photoCount: number;
  drafts: IngredientDraft[];
  hints: RecognitionHint[];
  unreadCount: number;
};

export type MockRecognitionScenario = "default" | "fail" | "partial" | "over";

export function limitRecognitionResult(result: ReceiptRecognitionResult) {
  return {
    ...result,
    drafts: result.drafts.slice(0, INGREDIENT_REGISTER_BATCH_LIMIT),
    hints: result.hints.slice(0, INGREDIENT_REGISTER_BATCH_LIMIT),
    isTruncated: result.drafts.length > INGREDIENT_REGISTER_BATCH_LIMIT,
  };
}

export function getRecognitionStatus(
  draft: IngredientDraft,
  hint: RecognitionHint,
): RecognitionStatus {
  const isMissing =
    draft.name.trim() === "" ||
    (draft.quantity === "" && draft.weightValue === "") ||
    draft.expirationDate === "";

  if (isMissing) return "UNRECOGNIZED";
  return hint ?? "RECOGNIZED";
}

// TODO: OCR API 연결 전 목업. 연결하면 응답을 이 모양으로 바꿔 넘긴다.
export function createMockRecognitionResult(
  scenario: MockRecognitionScenario = "default",
): ReceiptRecognitionResult {
  const today = getTodayInSeoul();
  const draft = (overrides: Partial<IngredientDraft>): IngredientDraft => ({
    ...createEmptyDraft(),
    ...overrides,
  });

  if (scenario === "fail") {
    return { photoCount: 1, drafts: [], hints: [], unreadCount: 6 };
  }

  if (scenario === "over") {
    const names = [
      "양파",
      "감자",
      "당근",
      "오이",
      "애호박",
      "버섯",
      "상추",
      "깻잎",
    ];
    const drafts = Array.from({ length: 23 }, (_, index) =>
      draft({
        category: "VEGETABLE",
        name: `${names[index % names.length]}${Math.floor(index / names.length) + 1}`,
        quantity: "1",
        expirationDate: addDaysToIsoDate(today, 7),
      }),
    );

    return {
      photoCount: 5,
      drafts,
      hints: drafts.map(() => null),
      unreadCount: 0,
    };
  }

  return {
    photoCount: 3,
    drafts: [
      draft({ category: "DAIRY", name: "우유", quantity: "1" }),
      draft({
        category: "TOFU_BEAN",
        name: "두부",
        quantity: "2",
        expirationDate: addDaysToIsoDate(today, 5),
      }),
      draft({
        category: "DAIRY",
        name: "계란",
        quantity: "10",
        expirationDate: addDaysToIsoDate(today, 14),
      }),
      draft({
        category: "VEGETABLE",
        name: "대파",
        quantity: "3",
        expirationDate: addDaysToIsoDate(today, 7),
      }),
    ],
    hints: [null, "NEEDS_CHECK", "AI_ESTIMATED", null],
    unreadCount: scenario === "partial" ? 2 : 0,
  };
}
