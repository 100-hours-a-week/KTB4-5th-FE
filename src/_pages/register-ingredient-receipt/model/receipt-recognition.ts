import type {
  ImageAnalysis,
  ImageAnalysisDisplayStatus,
  ImageAnalysisItem,
} from "@/entities/image";
import {
  INGREDIENT_CATEGORIES,
  INGREDIENT_STORAGE_TYPES,
  type IngredientRegistrationSource,
} from "@/entities/ingredient";
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
  sources: IngredientRegistrationSource[];
  unreadCount: number;
};

export function limitRecognitionResult(result: ReceiptRecognitionResult) {
  return {
    ...result,
    drafts: result.drafts.slice(0, INGREDIENT_REGISTER_BATCH_LIMIT),
    hints: result.hints.slice(0, INGREDIENT_REGISTER_BATCH_LIMIT),
    sources: result.sources.slice(0, INGREDIENT_REGISTER_BATCH_LIMIT),
    isTruncated: result.drafts.length > INGREDIENT_REGISTER_BATCH_LIMIT,
  };
}

const RECOGNITION_HINTS = {
  RECOGNIZED: null,
  AI_ESTIMATED: "AI_ESTIMATED",
  NEEDS_REVIEW: "NEEDS_CHECK",
  UNRECOGNIZED: "NEEDS_CHECK",
} satisfies Record<ImageAnalysisDisplayStatus, RecognitionHint>;

function isOneOf<T extends string>(
  values: readonly T[],
  value: string | null | undefined,
): value is T {
  return values.includes(value as T);
}

function toDraft(item: ImageAnalysisItem): IngredientDraft {
  const empty = createEmptyDraft();
  const { category, storageType } = item;

  return {
    category: isOneOf(INGREDIENT_CATEGORIES, category)
      ? category
      : empty.category,
    name: item.name ?? "",
    storageType: isOneOf(INGREDIENT_STORAGE_TYPES, storageType)
      ? storageType
      : empty.storageType,
    quantity: item.quantity === null ? "" : String(item.quantity),
    weightValue: item.weight ? String(item.weight.value) : "",
    weightUnit: item.weight?.unit === "ML" ? "ML" : "G",
    expirationDate: item.expiration ?? "",
  };
}

export function toRecognitionResult(
  analysis: ImageAnalysis,
): ReceiptRecognitionResult {
  const items = analysis.results.flatMap((result) => result.items);
  const sources = analysis.results.flatMap((result) =>
    result.items.map(() =>
      result.documentType === "RECEIPT" ? "RECEIPT" : "FOOD_IMAGE",
    ),
  );

  return {
    photoCount: analysis.results.length,
    drafts: items.map(toDraft),
    hints: items.map((item) => RECOGNITION_HINTS[item.displayStatus]),
    sources,
    unreadCount: analysis.results.filter((result) => result.items.length === 0)
      .length,
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
