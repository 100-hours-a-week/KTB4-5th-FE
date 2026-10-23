import type {
  ImageAnalysis,
  ImageAnalysisDisplayStatus,
  ImageAnalysisItem,
} from "@/entities/image";
import {
  INGREDIENT_CATEGORIES,
  INGREDIENT_STORAGE_TYPES,
} from "@/entities/ingredient";
import { sanitizeIngredientNameInput } from "@/features/ingredient-form";
import { INGREDIENT_REGISTER_BATCH_LIMIT } from "@/shared/config";
import { formatIsoDate } from "@/shared/lib/date";
import { getTodayInSeoul } from "@/shared/lib/seoul-date";
import {
  createEmptyDraft,
  ingredientDraftFormSchema,
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
  analysisId: string;
  photoCount: number;
  drafts: IngredientDraft[];
  hints: RecognitionHint[];
  expirationNotes: (string | null)[];
  origins: { imageObjectKey: string; itemId: string }[];
  unreadCount: number;
};

export function limitRecognitionResult(result: ReceiptRecognitionResult) {
  return {
    ...result,
    drafts: result.drafts.slice(0, INGREDIENT_REGISTER_BATCH_LIMIT),
    hints: result.hints.slice(0, INGREDIENT_REGISTER_BATCH_LIMIT),
    expirationNotes: result.expirationNotes.slice(
      0,
      INGREDIENT_REGISTER_BATCH_LIMIT,
    ),
    origins: result.origins.slice(0, INGREDIENT_REGISTER_BATCH_LIMIT),
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

function toExpirationDate({ expiration }: ImageAnalysisItem) {
  const today = getTodayInSeoul();
  if (typeof expiration === "string") {
    return expiration < today ? "" : expiration;
  }
  const range = expiration?.estimatedRange;
  const rangeDate =
    range && range.to >= today ? (range.from < today ? today : range.from) : "";
  const date = expiration?.date ?? rangeDate;
  return date < today ? "" : date;
}

function toExpirationNote({ expiration }: ImageAnalysisItem) {
  if (typeof expiration === "string" || !expiration?.estimatedRange) {
    return null;
  }
  const { from, to } = expiration.estimatedRange;
  return `AI 예상 ${formatIsoDate(from.slice(5))}~${formatIsoDate(to.slice(5))}`;
}

function toDraft(item: ImageAnalysisItem): IngredientDraft {
  const empty = createEmptyDraft();
  const { category, storageType } = item;
  const weightValue = item.weight?.value ? String(item.weight.value) : "";
  const isWeight = item.measureType === "WEIGHT" && weightValue !== "";

  return {
    category: isOneOf(INGREDIENT_CATEGORIES, category)
      ? category
      : empty.category,
    name: sanitizeIngredientNameInput(item.name ?? ""),
    storageType: isOneOf(INGREDIENT_STORAGE_TYPES, storageType)
      ? storageType
      : empty.storageType,
    quantity: !isWeight && item.quantity ? String(item.quantity) : "",
    weightValue: isWeight ? weightValue : "",
    weightUnit: item.weight?.unit === "ML" ? "ML" : "G",
    expirationDate: toExpirationDate(item),
  };
}

export function toRecognitionResult(
  analysis: ImageAnalysis,
): ReceiptRecognitionResult {
  const items = analysis.results.flatMap((result) => result.items);
  const origins = analysis.results.flatMap((result) =>
    result.items.map((item) => ({
      imageObjectKey: result.imageObjectKey,
      itemId: item.itemId,
    })),
  );

  return {
    analysisId: analysis.analysisId,
    photoCount: analysis.results.length,
    drafts: items.map(toDraft),
    hints: items.map((item) =>
      item.name && item.name !== sanitizeIngredientNameInput(item.name)
        ? "NEEDS_CHECK"
        : RECOGNITION_HINTS[item.displayStatus],
    ),
    expirationNotes: items.map(toExpirationNote),
    origins,
    unreadCount: analysis.results.filter((result) => result.items.length === 0)
      .length,
  };
}

export function getRecognitionStatus(
  draft: IngredientDraft,
  hint: RecognitionHint,
): RecognitionStatus {
  const isMissing =
    draft.category === "" ||
    draft.name.trim() === "" ||
    (draft.quantity === "" && draft.weightValue === "") ||
    draft.expirationDate === "";

  if (isMissing) return "UNRECOGNIZED";
  if (!ingredientDraftFormSchema.safeParse({ drafts: [draft] }).success) {
    return "NEEDS_CHECK";
  }
  return hint ?? "RECOGNIZED";
}

export function getAnalysisFailureMessage(analysis: ImageAnalysis) {
  const code =
    analysis.error?.code ??
    analysis.results.find((image) => image.error)?.error?.code;
  if (code === "ANALYSIS_EXPIRED")
    return "분석 시간이 초과됐어요. 잠시 후 다시 시도해 주세요.";
  if (code === "ANALYSIS_UNAVAILABLE")
    return "AI 서버의 일시적인 오류로 인식하지 못했어요. 잠시 후 다시 시도해 주세요.";
  return undefined;
}
