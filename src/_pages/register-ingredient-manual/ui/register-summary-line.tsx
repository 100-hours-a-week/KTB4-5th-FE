"use client";

import { useWatch } from "react-hook-form";

import { summarizeDrafts } from "../model/draft-summary";
import type { ManualRegisterFormInput } from "../model/manual-register-form-schema";
import type { RegisterCapacity } from "../model/register-capacity";

type RegisterSummaryLineProps = {
  id: string;
  capacity: RegisterCapacity;
};

// 20건 상한과 100종 한도를 목록 위에 함께 보여준다.
export function RegisterSummaryLine({
  id,
  capacity,
}: RegisterSummaryLineProps) {
  const drafts = useWatch<ManualRegisterFormInput, "drafts">({
    name: "drafts",
  });
  const summary = summarizeDrafts(drafts ?? [], capacity);
  const mergingCount = new Set(summary.mergingNames).size;

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
        </>
      )}
    </p>
  );
}
