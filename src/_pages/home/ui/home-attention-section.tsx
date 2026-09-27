import Image from "next/image";

import {
  formatIngredientAmount,
  type Ingredient,
  IngredientExpiryStamp,
} from "@/entities/ingredient";
import emptyIllustration from "@/shared/assets/illustrations/illustration-empty.webp";
import { routes } from "@/shared/routes";
import { LinkCard } from "@/shared/ui/link-card";

type HomeAttentionSectionProps = {
  items: Ingredient[];
};

function HomeAttentionEmpty() {
  return (
    <div className="flex items-center gap-3 rounded-[4px] bg-white px-4 py-3 shadow-app-sm">
      <span className="grid size-12 flex-none place-items-center rounded-full bg-app-warning/15">
        <Image
          src={emptyIllustration}
          alt=""
          sizes="48px"
          className="size-12 flex-none object-contain"
        />
      </span>
      <div className="min-w-0">
        <p className="mb-0 font-app-heading text-[15px] font-black text-app-ink">
          오늘 챙길 재료가 없어요
        </p>
        <p className="mb-0 mt-1 break-keep text-[12.5px] leading-tight text-app-ink/55">
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
            <ul className="mt-3 flex flex-col gap-2">
              {items.map((item) => (
                <li key={item.ingredientId}>
                  <LinkCard
                    href={`${routes.refrigerator}?filter=${item.status}`}
                    title={item.name}
                    description={formatIngredientAmount(item)}
                    trailing={
                      <IngredientExpiryStamp
                        status={item.status}
                        daysUntilExpiration={item.daysUntilExpiration}
                      />
                    }
                  />
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </section>
  );
}
