"use client";

import { useEffect, useRef, useState } from "react";

import { uploadImage } from "@/entities/image";

import {
  prepareProfileImage,
  ProfileImagePrepareError,
  type ProfileImageError,
} from "../lib/prepare-profile-image";

export type ProfileImageChange =
  | { kind: "keep" }
  | { kind: "reset" }
  | { kind: "replace"; objectKey: string; previewUrl: string };

export type ProfileImagePickerError = ProfileImageError | "upload";

export function useProfileImagePicker() {
  const [change, setChange] = useState<ProfileImageChange>({ kind: "keep" });
  const [error, setError] = useState<ProfileImagePickerError | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const latestPick = useRef(0);
  const previewUrl = change.kind === "replace" ? change.previewUrl : null;

  useEffect(
    () => () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    },
    [previewUrl],
  );

  async function pick(file: File) {
    const pickId = ++latestPick.current;
    setError(null);
    setIsUploading(true);

    try {
      const prepared = await prepareProfileImage(file);
      const objectKey = await uploadImage(prepared, "PROFILE");
      if (pickId !== latestPick.current) return;
      setChange({
        kind: "replace",
        objectKey,
        previewUrl: URL.createObjectURL(prepared),
      });
    } catch (caught) {
      if (pickId !== latestPick.current) return;
      setError(
        caught instanceof ProfileImagePrepareError ? caught.reason : "upload",
      );
    } finally {
      if (pickId === latestPick.current) setIsUploading(false);
    }
  }

  function reset() {
    latestPick.current += 1;
    setIsUploading(false);
    setError(null);
    setChange({ kind: "reset" });
  }

  return { change, error, isUploading, pick, reset };
}
