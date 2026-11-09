"use client";

import Image, { type ImageProps } from "next/image";
import { useState, type ReactNode } from "react";

type RecipeImageProps = Omit<ImageProps, "src" | "onError"> & {
  src: string | null;
  fallback: ReactNode;
};

export function RecipeImage({
  src,
  alt,
  fallback,
  ...props
}: RecipeImageProps) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);

  if (!src || failedSrc === src) return fallback;

  return (
    <Image
      unoptimized
      {...props}
      src={src}
      alt={alt}
      onError={() => setFailedSrc(src)}
    />
  );
}
