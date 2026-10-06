"use client";

import { useEffect, useRef, useState } from "react";

export const RECEIPT_PHOTO_LIMIT = 5;

// HEIC는 Chrome이 미리보기·캔버스 압축을 못 한다. 형식을 명시하면 iOS는 JPEG로 바꿔서 넘겨준다.
export const RECEIPT_PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp"];

export type ReceiptPhoto = {
  id: string;
  url: string;
  file: File;
};

/** 찍은 영수증 목록과 큰 미리보기에 띄울 사진 순번을 관리한다. */
export function useReceiptPhotos() {
  const [photos, setPhotos] = useState<ReceiptPhoto[]>([]);
  const [viewIndex, setViewIndex] = useState(0);

  const isFull = photos.length >= RECEIPT_PHOTO_LIMIT;
  const shownIndex = Math.min(viewIndex, photos.length - 1);

  const photosRef = useRef(photos);
  useEffect(() => {
    photosRef.current = photos;
  });
  useEffect(
    () => () =>
      photosRef.current.forEach((photo) => URL.revokeObjectURL(photo.url)),
    [],
  );

  function addPhoto(file: File) {
    if (isFull) return;

    setViewIndex(photos.length);
    setPhotos((current) => [
      ...current,
      { id: crypto.randomUUID(), url: URL.createObjectURL(file), file },
    ]);
  }

  function removePhoto(index: number) {
    const target = photos[index];
    if (!target) return;

    URL.revokeObjectURL(target.url);
    if (index < viewIndex) setViewIndex(viewIndex - 1);
    setPhotos((current) => current.filter((photo) => photo.id !== target.id));
  }

  return {
    photos,
    isFull,
    shownIndex,
    showPhoto: setViewIndex,
    addPhoto,
    removePhoto,
  };
}
