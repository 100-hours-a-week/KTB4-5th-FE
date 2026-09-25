"use client";

import Image, { type StaticImageData } from "next/image";
import { useState } from "react";

type AsyncViewIllustrationProps = {
  src: StaticImageData;
};

/**
 * 일러스트가 도착하기 전까지 같은 크기의 스켈레톤을 보여주고,
 * 로드가 끝나면 이미지를 페이드인해 빈 영역에서 갑자기 나타나지 않게 한다.
 */
export function AsyncViewIllustration({ src }: AsyncViewIllustrationProps) {
  const [isSettled, setIsSettled] = useState(false);

  return (
    <span className="relative block h-[120px] w-[160px]">
      {isSettled ? null : (
        <span
          aria-hidden="true"
          className="absolute inset-0 animate-pulse rounded-[4px] bg-app-ink/[0.06]"
        />
      )}
      <Image
        src={src}
        alt=""
        sizes="160px"
        loading="eager"
        onLoad={() => setIsSettled(true)}
        onError={() => setIsSettled(true)}
        className={`size-full object-contain transition-opacity duration-300 ${
          isSettled ? "opacity-100" : "opacity-0"
        }`}
      />
    </span>
  );
}
