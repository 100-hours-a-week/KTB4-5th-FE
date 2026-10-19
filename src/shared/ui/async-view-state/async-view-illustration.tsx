import type { StaticImageData } from "next/image";

type AsyncViewIllustrationProps = {
  src: StaticImageData;
};

const settleImage = "this.dataset.settled=''";

/**
 * 일러스트가 도착하기 전까지 같은 크기의 스켈레톤을 보여주고,
 * 로드가 끝나면 이미지를 페이드인해 빈 영역에서 갑자기 나타나지 않게 한다.
 */
export function AsyncViewIllustration({ src }: AsyncViewIllustrationProps) {
  return (
    <span className="group relative block h-[120px] w-[160px]">
      <span
        aria-hidden="true"
        className="absolute inset-0 animate-pulse rounded-[4px] bg-app-ink/[0.06] group-has-[img[data-settled]]:hidden"
      />
      <span
        suppressHydrationWarning
        className="contents [&_img]:size-full [&_img]:object-contain [&_img]:opacity-0 [&_img]:transition-opacity [&_img]:duration-150 [&_img[data-settled]]:opacity-100"
        dangerouslySetInnerHTML={{
          __html: `<img src="${src.src}" alt="" width="${src.width}" height="${src.height}" decoding="async" onload="${settleImage}" onerror="${settleImage}">`,
        }}
      />
    </span>
  );
}
