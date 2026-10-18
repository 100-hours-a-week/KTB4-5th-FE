import type {
  RegisterIngredientItem,
  RegisterIngredientsFromAnalysisBody,
} from "@/entities/ingredient";

import type { ReceiptRecognitionResult } from "./receipt-recognition";

export function toAnalysisRegistrationBody(
  analysisId: string,
  origins: ReceiptRecognitionResult["origins"],
  items: readonly RegisterIngredientItem[],
): RegisterIngredientsFromAnalysisBody {
  const images: RegisterIngredientsFromAnalysisBody["images"] = [];

  items.forEach((item, index) => {
    const origin = origins[index];
    if (!origin) throw new Error("분석 원본 항목을 찾을 수 없어요");

    let image = images.find(
      (entry) => entry.imageObjectKey === origin.imageObjectKey,
    );
    if (!image) {
      image = { imageObjectKey: origin.imageObjectKey, items: [] };
      images.push(image);
    }

    const { weightValue, weightUnit, expirationDate, ...values } = item;
    if (weightValue !== null && weightUnit === "NONE") {
      throw new Error("무게 단위를 확인해 주세요");
    }
    image.items.push({
      ...values,
      itemId: origin.itemId,
      weight:
        weightValue !== null && weightUnit !== "NONE"
          ? { value: weightValue, unit: weightUnit }
          : null,
      expiration: expirationDate,
    });
  });

  return { analysisId, images };
}
