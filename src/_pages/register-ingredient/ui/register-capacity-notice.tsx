import { routes } from "@/shared/routes";
import { AppLink } from "@/shared/ui/app-link";

import type { IngredientCapacity } from "@/entities/ingredient";

type RegisterCapacityNoticeProps = {
  capacity: IngredientCapacity;
};

export function RegisterCapacityNotice({
  capacity,
}: RegisterCapacityNoticeProps) {
  const { stockTypeCount, stockTypeLimit, remainingSlots, isLimitReached } =
    capacity;

  return (
    // 좌우 여백은 화면(20px)이 이미 갖고 있으므로 여기서 다시 넣지 않는다.
    <div>
      <p className="m-0 break-keep text-[13.5px] leading-snug text-app-ink/65">
        현재{" "}
        <span className="font-bold text-app-ink">
          {stockTypeCount} / {stockTypeLimit}종
        </span>
        {" · "}
        {isLimitReached ? (
          <span className="font-bold text-app-primary">
            한도에 도달했어요. 정리 후 등록해 주세요
          </span>
        ) : (
          `${remainingSlots}종 더 담을 수 있어요`
        )}
      </p>

      {isLimitReached ? (
        <AppLink
          href={routes.refrigerator}
          className="mt-2 inline-block text-[12.5px] font-bold text-app-ink no-underline hover:text-app-primary"
        >
          냉장고 정리하러 가기 ›
        </AppLink>
      ) : null}
    </div>
  );
}
