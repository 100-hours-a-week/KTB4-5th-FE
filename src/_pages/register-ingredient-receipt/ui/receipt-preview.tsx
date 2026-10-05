import { ChevronLeftOutlined } from "@lineiconshq/free-icons";
import { Lineicons } from "@lineiconshq/react-lineicons";
import Image from "next/image";

import type { ReceiptPhoto } from "../model/use-receipt-photos";

const NAV_CLASS_NAME =
  "absolute top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-full border-0 bg-app-ink/60 p-0 text-white disabled:opacity-30";

type ReceiptPreviewProps = {
  photos: ReceiptPhoto[];
  shownIndex: number;
  onShow: (index: number) => void;
};

/** 큰 미리보기. 사진이 2장 이상이면 < > 로 넘겨 본다. */
export function ReceiptPreview({
  photos,
  shownIndex,
  onShow,
}: ReceiptPreviewProps) {
  const shownPhoto = photos[shownIndex];

  return (
    <div className="relative grid aspect-square place-items-center overflow-hidden rounded-[12px] bg-app-ink/[0.06]">
      {shownPhoto ? (
        <Image
          src={shownPhoto.url}
          alt={`영수증 ${shownIndex + 1} / ${photos.length}`}
          fill
          unoptimized
          className="object-contain"
        />
      ) : (
        <p className="m-0 px-6 text-center text-[13.5px] text-app-ink/60">
          촬영한 영수증이 여기에 보여요
        </p>
      )}
      {photos.length > 1 ? (
        <>
          <button
            type="button"
            disabled={shownIndex === 0}
            onClick={() => onShow(shownIndex - 1)}
            aria-label="이전 사진"
            className={`left-2 ${NAV_CLASS_NAME}`}
          >
            <Lineicons
              icon={ChevronLeftOutlined}
              size={18}
              strokeWidth={2}
              aria-hidden="true"
              focusable="false"
            />
          </button>
          <button
            type="button"
            disabled={shownIndex === photos.length - 1}
            onClick={() => onShow(shownIndex + 1)}
            aria-label="다음 사진"
            className={`right-2 ${NAV_CLASS_NAME}`}
          >
            <Lineicons
              icon={ChevronLeftOutlined}
              className="rotate-180"
              size={18}
              strokeWidth={2}
              aria-hidden="true"
              focusable="false"
            />
          </button>
        </>
      ) : null}
    </div>
  );
}
