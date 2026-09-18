import Image from "next/image";

import { HomeAttentionCard } from "./home-attention-card";
import type { HomeAttentionItem } from "../model/home-summary";

type HomeAttentionSectionProps = {
  items: HomeAttentionItem[];
};

function HomeAttentionEmpty() {
  return (
    <div className="flex items-center gap-4 rounded-[4px] bg-white px-[18px] py-5 shadow-app-sm">
      <Image
        src="/icons/empty_logo.png"
        alt=""
        width={64}
        height={64}
        className="size-16 flex-none object-contain"
      />
      <div className="min-w-0">
        <p className="mb-0 font-app-heading text-[17px] font-black text-app-ink">
          오늘 챙길 재료가 없어요
        </p>
        <p className="mb-0 mt-1 break-keep text-[13px] leading-tight text-app-ink/55">
          유효기간이 3일 안에 끝나는 재료가 생기면 여기에서 알려드릴게요
        </p>
      </div>
    </div>
  );
}

export function HomeAttentionSection({ items }: HomeAttentionSectionProps) {
  const attentionCount = items.length;

  return (
    <section className="px-5 pt-6" aria-labelledby="home-attention-heading">
      <div className="border-t border-dashed border-app-ink/20 pt-4">
        <h3 id="home-attention-heading" className="font-bold text-app-ink">
          오늘 챙길 재료
        </h3>

        {attentionCount === 0 ? (
          <HomeAttentionEmpty />
        ) : (
          <>
            <ul className="mt-5 flex flex-col gap-3">
              {items.map((item) => (
                <li key={item.id}>
                  <HomeAttentionCard item={item} />
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </section>
  );
}
