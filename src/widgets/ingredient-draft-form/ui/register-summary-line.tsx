"use client";

import { useWatch } from "react-hook-form";

import { summarizeDrafts } from "../model/draft-summary";
import type { IngredientDraftFormInput } from "../model/ingredient-draft-form-schema";
import type { RegisterCapacity } from "../model/register-capacity";

type RegisterSummaryLineProps = {
  id: string;
  capacity: RegisterCapacity;
  showUnsetExpirationCount?: boolean;
};

export function RegisterSummaryLine({
  id,
  capacity,
  showUnsetExpirationCount = false,
}: RegisterSummaryLineProps) {
  const drafts = useWatch<IngredientDraftFormInput, "drafts">({
    name: "drafts",
  });
  const summary = summarizeDrafts(drafts ?? [], capacity);
  const mergingCount = new Set(summary.mergingNames).size;
  const unsetExpirationCount = showUnsetExpirationCount
    ? (drafts ?? []).filter((draft) => draft.expirationDate === "").length
    : 0;

  return (
    <p
      id={id}
      aria-live="polite"
      className="m-0 text-[11.5px] leading-tight text-app-ink/60"
    >
      {summary.draftCount} / {summary.batchLimit}건
      {summary.overLimitCount > 0 ? (
        <>
          {" · "}
          <span className="font-bold text-app-primary">
            {summary.overLimitCount}종을 줄여야 등록할 수 있어요
          </span>
        </>
      ) : (
        <>
          {" · "}신규 {summary.newStockTypeCount}종{" · "}등록 후{" "}
          <span className="font-bold text-app-ink">
            {summary.stockTypeCountAfter} / {summary.stockTypeLimit}종
          </span>
          {mergingCount > 0 ? (
            <>
              {" · "}
              <span className="text-app-ink/60">
                {mergingCount}종은 기존 재료에 합쳐져요
              </span>
            </>
          ) : null}
          {unsetExpirationCount > 0 ? (
            <>
              {" · "}유통기한 {unsetExpirationCount}건 미지정
            </>
          ) : null}
        </>
      )}
    </p>
  );
}
