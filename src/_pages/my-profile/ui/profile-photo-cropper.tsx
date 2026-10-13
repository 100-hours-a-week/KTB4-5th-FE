"use client";

import {
  ArrowLeftOutlined,
  MinusOutlined,
  PlusOutlined,
} from "@lineiconshq/free-icons";
import { Lineicons } from "@lineiconshq/react-lineicons";
import { useState } from "react";
import Cropper, { type Area } from "react-easy-crop";

import { AppHeader } from "@/shared/ui/app-header";
import { FooterButton } from "@/shared/ui/footer-button";

const MIN_ZOOM = 1;
const MAX_ZOOM = 3;
const ZOOM_STEP = 0.1;

type ProfilePhotoCropperProps = {
  src: string;
  isApplying: boolean;
  onCancel: () => void;
  onApply: (area: Area) => void;
  onLoadError: () => void;
};

export function ProfilePhotoCropper({
  src,
  isApplying,
  onCancel,
  onApply,
  onLoadError,
}: ProfilePhotoCropperProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(MIN_ZOOM);
  const [area, setArea] = useState<Area | null>(null);

  function changeZoom(next: number) {
    setZoom(Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, next)));
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="사진 편집"
      className="fixed inset-y-0 left-1/2 z-40 flex w-full max-w-[var(--app-max-width)] -translate-x-1/2 flex-col bg-app-canvas"
    >
      <AppHeader
        title="사진 편집"
        leading={
          <button
            type="button"
            onClick={onCancel}
            disabled={isApplying}
            aria-label="사진 편집 취소"
            className="grid size-[var(--tap-min)] place-items-center border-0 bg-transparent p-0 text-app-text hover:text-app-primary"
          >
            <Lineicons
              icon={ArrowLeftOutlined}
              size={23}
              strokeWidth={1.8}
              aria-hidden="true"
              focusable="false"
            />
          </button>
        }
      />

      <div className="min-h-0 flex-1 overflow-y-auto px-5 pt-3">
        <div className="relative h-[260px] overflow-hidden rounded-[4px] bg-app-ink">
          <Cropper
            image={src}
            crop={crop}
            zoom={zoom}
            minZoom={MIN_ZOOM}
            maxZoom={MAX_ZOOM}
            aspect={1}
            cropShape="round"
            cropSize={{ width: 200, height: 200 }}
            objectFit="cover"
            showGrid={false}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={(_, pixels) => setArea(pixels)}
            mediaProps={{ onError: onLoadError }}
          />
        </div>
        <p className="m-0 mt-3 text-center text-[13px] text-app-ink/55">
          원 안에 얼굴이 오도록 맞춰 주세요
        </p>

        <div className="mt-4 flex items-center gap-2">
          <button
            type="button"
            aria-label="축소"
            onClick={() => changeZoom(zoom - ZOOM_STEP)}
            disabled={zoom <= MIN_ZOOM}
            className="grid size-[var(--tap-min)] flex-none place-items-center text-app-ink disabled:text-app-neutral-400"
          >
            <Lineicons icon={MinusOutlined} size={20} aria-hidden="true" />
          </button>
          <input
            type="range"
            aria-label="확대 배율"
            min={MIN_ZOOM}
            max={MAX_ZOOM}
            step={ZOOM_STEP}
            value={zoom}
            onChange={(event) => changeZoom(Number(event.target.value))}
            className="min-w-0 flex-1 accent-app-ink"
          />
          <button
            type="button"
            aria-label="확대"
            onClick={() => changeZoom(zoom + ZOOM_STEP)}
            disabled={zoom >= MAX_ZOOM}
            className="grid size-[var(--tap-min)] flex-none place-items-center text-app-ink disabled:text-app-neutral-400"
          >
            <Lineicons icon={PlusOutlined} size={20} aria-hidden="true" />
          </button>
        </div>
        <p className="m-0 mt-1 text-[13px] text-app-ink/55">
          확대·이동해서 원하는 부분을 고를 수 있어요.
        </p>
      </div>

      <footer className="flex flex-none gap-3 px-5 pt-3 pb-[calc(20px+var(--safe-bottom))]">
        <FooterButton
          variant="secondary"
          onClick={onCancel}
          disabled={isApplying}
        >
          취소
        </FooterButton>
        <FooterButton
          onClick={() => area && onApply(area)}
          disabled={area === null || isApplying}
        >
          {isApplying ? "로딩 중" : "적용"}
        </FooterButton>
      </footer>
    </div>
  );
}
