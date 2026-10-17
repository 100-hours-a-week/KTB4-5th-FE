"use client";

import { useRouter } from "next/navigation";
import { useRef, type ChangeEvent } from "react";

import { useFormLeaveGuard } from "@/features/ingredient-form";
import { routes } from "@/shared/routes";
import { AppDialog } from "@/shared/ui/app-dialog";
import { AsyncViewState } from "@/shared/ui/async-view-state";
import { FooterButton } from "@/shared/ui/footer-button";
import { showAppToast } from "@/shared/ui/app-toast";
import { PageActionLayout } from "@/shared/ui/page-action-layout";

import { useReceiptAnalysis } from "../model/use-receipt-analysis";
import {
  RECEIPT_PHOTO_MAX_BYTES,
  RECEIPT_PHOTO_TYPES,
  useReceiptPhotos,
} from "../model/use-receipt-photos";
import { ReceiptAnalysisFailureDialog } from "./receipt-analysis-failure-dialog";
import { ReceiptPhotoStrip } from "./receipt-photo-strip";
import { ReceiptPreview } from "./receipt-preview";
import { ReceiptUncheckedResultDialog } from "./receipt-unchecked-result-dialog";

const PAGE_ID = "register-receipt-page";

export function RegisterIngredientReceiptPage() {
  const inputRef = useRef<HTMLInputElement>(null);
  const { photos, isFull, shownIndex, showPhoto, addPhoto, removePhoto } =
    useReceiptPhotos();
  const router = useRouter();
  const {
    isAnalyzing,
    progress,
    analyze,
    failure,
    failureMessage,
    dismissFailure,
    uncheckedResult,
    isDiscarding,
    discardUncheckedResult,
  } = useReceiptAnalysis();
  const leaveDialog = useFormLeaveGuard({
    formId: PAGE_ID,
    isGuarded: photos.length > 0 && !isAnalyzing,
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

    if (file.size > RECEIPT_PHOTO_MAX_BYTES) {
      showAppToast({
        message: "10MB 이하 사진만 올릴 수 있어요",
        variant: "error",
      });
      return;
    }

    addPhoto(file);
  }

  if (isAnalyzing) {
    return (
      <PageActionLayout
        action={
          <div className="flex">
            <FooterButton onClick={() => router.push(routes.home)}>
              다른 화면 둘러보기
            </FooterButton>
          </div>
        }
      >
        <AsyncViewState
          status="loading"
          title="영수증을 인식하고 있어요"
          description="다른 화면으로 이동해도 인식은 계속돼요. 완료되면 알려 드릴게요."
          action={
            <div className="flex w-[200px] items-center gap-2 text-[12px] font-bold text-app-ink/60">
              <progress
                aria-label="영수증 인식 진행률"
                value={progress.processed}
                max={progress.total || 1}
                className="h-1.5 flex-1 appearance-none overflow-hidden rounded-full [&::-moz-progress-bar]:bg-app-ink [&::-webkit-progress-bar]:bg-app-ink/10 [&::-webkit-progress-value]:bg-app-ink"
              />
              {progress.processed}/{progress.total}장
            </div>
          }
        />
      </PageActionLayout>
    );
  }

  return (
    <PageActionLayout
      action={
        <div className="flex gap-2">
          <FooterButton
            variant={photos.length > 0 ? "secondary" : "primary"}
            disabled={isFull}
            onClick={openCamera}
          >
            촬영
          </FooterButton>
          {photos.length > 0 ? (
            <FooterButton
              onClick={() => analyze(photos.map((photo) => photo.file))}
            >
              인식하기
            </FooterButton>
          ) : null}
        </div>
      }
    >
      <div id={PAGE_ID} className="px-5 pt-4 pb-6">
        <input
          ref={inputRef}
          type="file"
          accept={RECEIPT_PHOTO_TYPES.join(",")}
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
            <li>· AI 인식은 한국 시간 오전 9시~오후 6시에 이용할 수 있어요</li>
            <li>· 하루 최대 100장까지 분석할 수 있어요</li>
            <li>· 구겨진 부분을 펴고 밝은 곳에서 찍어 주세요</li>
            <li>· 영수증 전체가 화면에 들어오게 해주세요 (최대 5장)</li>
            <li>· 흐리게 찍혀도 다음 화면에서 직접 고칠 수 있어요</li>
          </ul>
        </section>
      </div>

      <AppDialog {...leaveDialog} />
      <ReceiptAnalysisFailureDialog
        failure={failure}
        failureMessage={failureMessage}
        onRetake={dismissFailure}
      />
      {uncheckedResult ? (
        <ReceiptUncheckedResultDialog
          key={uncheckedResult.analysisId}
          analysis={uncheckedResult}
          isDiscarding={isDiscarding}
          onDiscard={discardUncheckedResult}
        />
      ) : null}
    </PageActionLayout>
  );
}
