"use client";

import { UserAvatar } from "@/entities/user";

import { PROFILE_IMAGE_ACCEPT } from "../lib/prepare-profile-image";
import type { ProfileImagePickerError } from "../model/use-profile-image-picker";

const HELPER_TEXT = "형식: JPG · PNG · WebP";

const ERROR_TEXT: Record<ProfileImagePickerError, string> = {
  type: "JPG · PNG · WebP 사진만 올릴 수 있어요",
  size: "사진이 너무 커요. 10MB 이하로 골라 주세요",
  read: "사진을 불러오지 못했어요. 다른 사진을 골라 주세요",
  upload: "사진을 올리지 못했어요. 잠시 후 다시 시도해 주세요",
};

type ProfileImageFieldProps = {
  src: string | null;
  error: ProfileImagePickerError | null;
  isUploading: boolean;
  onPick: (file: File) => void;
  onReset: () => void;
};

export function ProfileImageField({
  src,
  error,
  isUploading,
  onPick,
  onReset,
}: ProfileImageFieldProps) {
  return (
    <section className="flex flex-col items-center">
      <div className="relative">
        <label
          className={`block rounded-full focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-app-primary ${isUploading ? "cursor-wait opacity-60" : "cursor-pointer"}`}
        >
          <UserAvatar src={src} size={88} />
          <input
            type="file"
            accept={PROFILE_IMAGE_ACCEPT}
            disabled={isUploading}
            aria-label="프로필 사진 변경"
            aria-describedby="profile-image-help"
            className="sr-only"
            onChange={(event) => {
              const file = event.target.files?.[0];
              event.target.value = "";
              if (file) onPick(file);
            }}
          />
        </label>
        {src && !/(?:^|\/)profiles\/default\.png(?:[?#]|$)/.test(src) ? (
          <button
            type="button"
            aria-label="프로필 사진 지우기"
            onClick={onReset}
            className="absolute -top-1 -right-1 grid size-7 place-items-center rounded-full bg-app-ink text-[15px] font-bold leading-none text-white shadow-app-sm"
          >
            ×
          </button>
        ) : null}
      </div>
      <p
        id="profile-image-help"
        aria-live="polite"
        className={`mb-0 mt-2 text-sm leading-5 ${error ? "text-app-primary" : "text-app-ink/50"}`}
      >
        {error
          ? ERROR_TEXT[error]
          : isUploading
            ? "사진을 올리는 중이에요"
            : HELPER_TEXT}
      </p>
    </section>
  );
}
