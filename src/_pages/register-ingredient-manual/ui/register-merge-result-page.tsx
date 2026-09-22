"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import {
  INGREDIENT_QUANTITY_UNIT,
  INGREDIENT_STORAGE_TYPE_LABELS,
  INGREDIENT_WEIGHT_UNIT_LABELS,
} from "@/entities/ingredient";
import { formatExpirationDate } from "@/features/select-expiration-date";
import { markAppNavigationIntent } from "@/shared/lib/navigation-history";
import { routes } from "@/shared/routes";
import { FooterButton } from "@/shared/ui/footer-button";
import { NotePaper } from "@/shared/ui/note-paper";
import { PageActionLayout } from "@/shared/ui/page-action-layout";

import type { RegisterMergedItem } from "../model/register-result";
import { useRegisterResultStore } from "../model/use-register-result-store";

type AmountKey = "previous" | "added" | "total";

function formatNumber(value: number | string) {
  const numericValue = Number(value);

  return Number.isFinite(numericValue)
    ? numericValue.toLocaleString("ko-KR")
    : String(value);
}

function formatMergedAmount(item: RegisterMergedItem, key: AmountKey) {
  if (item.measureType === "COUNT") {
    const quantity =
      key === "previous"
        ? item.previousQuantity
        : key === "added"
          ? item.addedQuantity
          : item.totalQuantity;

    return quantity === null
      ? "-"
      : `${formatNumber(quantity)}${INGREDIENT_QUANTITY_UNIT}`;
  }

  const weightValue =
    key === "previous"
      ? item.previousWeightValue
      : key === "added"
        ? item.addedWeightValue
        : item.totalWeightValue;
  const unit = INGREDIENT_WEIGHT_UNIT_LABELS[item.weightUnit];

  return weightValue === null ? "-" : `${formatNumber(weightValue)}${unit}`;
}

export function RegisterMergeResultPage() {
  const router = useRouter();
  const result = useRegisterResultStore((state) => state.result);
  const clearResult = useRegisterResultStore((state) => state.clearResult);
  const [isLeaving, setIsLeaving] = useState(false);

  function leaveTo(href: string) {
    if (isLeaving) {
      return;
    }

    setIsLeaving(true);
    clearResult();
    markAppNavigationIntent("replace", href);
    router.replace(href);
  }

  if (!result || result.mergedItems.length === 0) {
    return (
      <PageActionLayout
        action={
          <div className="flex">
            <FooterButton
              disabled={isLeaving}
              onClick={() => leaveTo(routes.registerIngredient)}
            >
              등록 화면으로 돌아가기
            </FooterButton>
          </div>
        }
      >
        <section className="px-5 pt-6">
          <h2 className="m-0 font-app-heading text-[22px] font-black leading-[1.35]">
            확인할 합산 결과가 없어요
          </h2>
          <p className="m-[8px_0_0] text-[14px] leading-[1.5] text-app-ink/55">
            등록 화면에서 재료를 다시 확인해 주세요.
          </p>
        </section>
      </PageActionLayout>
    );
  }

  const registeredCount = result.createdCount + result.mergedCount;

  return (
    <PageActionLayout
      action={
        <div className="flex gap-[10px]">
          <FooterButton
            variant="secondary"
            disabled={isLeaving}
            onClick={() => leaveTo(routes.registerIngredient)}
          >
            계속 등록
          </FooterButton>
          <FooterButton
            disabled={isLeaving}
            onClick={() => leaveTo(routes.refrigerator)}
          >
            냉장고 보기
          </FooterButton>
        </div>
      }
    >
      <section className="px-5 pt-5 pb-6">
        <h2 className="m-0 font-app-heading text-[22px] font-black leading-[1.35]">
          기존 재료와 합쳐졌어요
        </h2>
        <p className="m-[6px_0_0] text-[14px] leading-[1.45] text-app-ink/50">
          등록한 {registeredCount}건 중 {result.mergedCount}건의 수량이
          합산됐습니다.
        </p>

        <ul className="m-[22px_0_0] flex list-none flex-col gap-3 p-0">
          {result.mergedItems.map((item) => (
            <li key={item.ingredientId}>
              <NotePaper foldSize={22}>
                <div className="px-4 pt-[17px] pr-5 pb-6">
                  <div className="flex items-baseline gap-3">
                    <strong className="min-w-0 flex-1 truncate font-app-heading text-[15px] font-black leading-[1.35]">
                      {item.name} ·{" "}
                      {INGREDIENT_STORAGE_TYPE_LABELS[item.storageType]}
                    </strong>
                    <span className="flex-none text-[12px] text-app-ink/45">
                      유통기한 {formatExpirationDate(item.expirationDate)}
                    </span>
                  </div>

                  <div className="mt-4 grid grid-cols-[1fr_auto_1fr_auto_1fr] items-baseline gap-2 text-[13px] text-app-ink/65">
                    <span>기존 {formatMergedAmount(item, "previous")}</span>
                    <span aria-hidden="true">+</span>
                    <span>추가 {formatMergedAmount(item, "added")}</span>
                    <span aria-hidden="true">=</span>
                    <strong className="text-right font-app-heading text-[15px] font-black text-app-ink">
                      총 {formatMergedAmount(item, "total")}
                    </strong>
                  </div>
                </div>
              </NotePaper>
            </li>
          ))}
        </ul>

        <aside className="mt-5 rounded-[10px] border border-app-ink/12 px-4 py-4 text-[12px] leading-[1.5] text-app-ink/50">
          <p className="m-0 flex gap-2 font-bold text-app-ink/65">
            <span
              aria-hidden="true"
              className="grid size-[18px] flex-none place-items-center rounded-full bg-app-neutral-200 text-[11px]"
            >
              i
            </span>
            <span>중복 재료는 신규 재료 종류에 포함되지 않아요.</span>
          </p>
          <p className="m-[10px_0_0]">
            단위·보관 방법·유통기한이 다르면 별도 재고로 관리돼요.
          </p>
        </aside>
      </section>
    </PageActionLayout>
  );
}
