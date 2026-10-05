import { XmarkOutlined } from "@lineiconshq/free-icons";
import { Lineicons } from "@lineiconshq/react-lineicons";
import Image from "next/image";

import {
  RECEIPT_PHOTO_LIMIT,
  type ReceiptPhoto,
} from "../model/use-receipt-photos";

type ReceiptPhotoStripProps = {
  photos: ReceiptPhoto[];
  shownIndex: number;
  disabled: boolean;
  onShow: (index: number) => void;
  onRemove: (index: number) => void;
  onCapture: () => void;
};

/** 5칸 썸네일. 찬 칸은 크게 보기·삭제, 빈 칸은 촬영 버튼과 같다. */
export function ReceiptPhotoStrip({
  photos,
  shownIndex,
  disabled,
  onShow,
  onRemove,
  onCapture,
}: ReceiptPhotoStripProps) {
  return (
    <div className="mt-3 flex items-center gap-2">
      <ul className="m-0 grid flex-1 list-none grid-cols-5 gap-2 p-0">
        {Array.from({ length: RECEIPT_PHOTO_LIMIT }, (_, index) => {
          const photo = photos[index];

          return (
            <li
              key={photo?.id ?? `empty-${index}`}
              className={`relative aspect-square overflow-hidden rounded-[10px] border-[1.5px] bg-app-ink/[0.04] ${
                photo && index === shownIndex
                  ? "border-app-ink"
                  : "border-app-ink/10"
              }`}
            >
              {photo ? (
                <>
                  <button
                    type="button"
                    onClick={() => onShow(index)}
                    aria-label={`영수증 ${index + 1} 크게 보기`}
                    aria-current={index === shownIndex}
                    className="absolute inset-0 border-0 bg-transparent p-0"
                  >
                    <Image
                      src={photo.url}
                      alt=""
                      fill
                      unoptimized
                      className="object-cover"
                    />
                  </button>
                  <button
                    type="button"
                    disabled={disabled}
                    onClick={() => onRemove(index)}
                    aria-label={`영수증 ${index + 1} 삭제`}
                    className="absolute top-0.5 right-0.5 grid size-5 place-items-center rounded-full border-0 bg-app-ink/70 p-0 text-white disabled:opacity-45"
                  >
                    <Lineicons
                      icon={XmarkOutlined}
                      size={12}
                      strokeWidth={2}
                      aria-hidden="true"
                      focusable="false"
                    />
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  disabled={disabled}
                  onClick={onCapture}
                  aria-label="영수증 촬영"
                  className="absolute inset-0 cursor-pointer border-0 bg-transparent p-0 disabled:cursor-not-allowed"
                />
              )}
            </li>
          );
        })}
      </ul>
      <span className="flex-none text-[13px] font-bold text-app-ink/60">
        {photos.length} / {RECEIPT_PHOTO_LIMIT}
      </span>
    </div>
  );
}
