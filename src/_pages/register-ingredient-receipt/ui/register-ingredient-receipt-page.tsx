"use client";

import { useRef, type ChangeEvent } from "react";

import { useFormLeaveGuard } from "@/features/ingredient-form";
import { AppDialog } from "@/shared/ui/app-dialog";
import { FooterButton } from "@/shared/ui/footer-button";
import { showAppToast } from "@/shared/ui/app-toast";
import { PageActionLayout } from "@/shared/ui/page-action-layout";

import { useReceiptAnalysis } from "../model/use-receipt-analysis";
import {
  RECEIPT_PHOTO_TYPES,
  useReceiptPhotos,
} from "../model/use-receipt-photos";
import { ReceiptPhotoStrip } from "./receipt-photo-strip";
import { ReceiptPreview } from "./receipt-preview";

const PAGE_ID = "register-receipt-page";

export function RegisterIngredientReceiptPage() {
  const inputRef = useRef<HTMLInputElement>(null);
  const { photos, isFull, shownIndex, showPhoto, addPhoto, removePhoto } =
    useReceiptPhotos();
  const { isAnalyzing, isSlow, analyze } = useReceiptAnalysis();
  const leaveDialog = useFormLeaveGuard({
    formId: PAGE_ID,
    isGuarded: photos.length > 0,
    title: "촬영한 사진이 사라져요",
    description: "지금 나가면 찍은 영수증이 저장되지 않아요.",
    continueLabel: "계속 촬영",
  });

  function openCamera() {
    inputRef.current?.click();
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    // 같은 사진을 다시 골라도 change가 일어나도록 비운다.
    event.target.value = "";

    if (!file) return;

    if (!RECEIPT_PHOTO_TYPES.includes(file.type)) {
      showAppToast({
        message: "JPG·PNG 사진만 올릴 수 있어요",
        variant: "error",
      });
      return;
    }

    addPhoto(file);
  }

  return (
    <PageActionLayout
      action={
        <>
          {isSlow ? (
            <p
              role="status"
              className="m-0 mb-2 text-center text-[12.5px] text-app-ink/65"
            >
              조금만 기다려 주세요
            </p>
          ) : null}
          <div className="flex gap-2">
            <FooterButton
              variant={photos.length > 0 ? "secondary" : "primary"}
              disabled={isFull || isAnalyzing}
              onClick={openCamera}
            >
              촬영
            </FooterButton>
            {photos.length > 0 ? (
              <FooterButton
                aria-busy={isAnalyzing}
                disabled={isAnalyzing}
                onClick={analyze}
              >
                {isAnalyzing ? "로딩 중" : "인식하기"}
              </FooterButton>
            ) : null}
          </div>
        </>
      }
    >
      <div id={PAGE_ID} className="px-5 pt-4 pb-6">
        <input
          ref={inputRef}
          type="file"
          accept={RECEIPT_PHOTO_TYPES.join(",")}
          capture="environment"
          hidden
          onChange={handleFileChange}
        />

        <ReceiptPreview
          photos={photos}
          shownIndex={shownIndex}
          onShow={showPhoto}
        />
        <ReceiptPhotoStrip
          photos={photos}
          shownIndex={shownIndex}
          disabled={isAnalyzing}
          onShow={showPhoto}
          onRemove={removePhoto}
          onCapture={openCamera}
        />

        <section className="mt-6" aria-labelledby="receipt-guide-heading">
          <h2
            id="receipt-guide-heading"
            className="m-0 text-[16px] font-black text-app-ink"
          >
            인식률을 높이려면
          </h2>
          <ul className="m-0 mt-3 list-none space-y-2 p-0 text-[13.5px] text-app-ink/65">
            <li>· 구겨진 부분을 펴고 밝은 곳에서 찍어 주세요</li>
            <li>· 영수증 전체가 화면에 들어오게 해주세요 (최대 5장)</li>
            <li>· 흐리게 찍혀도 다음 화면에서 직접 고칠 수 있어요</li>
          </ul>
        </section>
      </div>

      <AppDialog {...leaveDialog} />
    </PageActionLayout>
  );
}
