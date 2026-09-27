import { routes } from "@/shared/routes";
import { AppLink } from "@/shared/ui/app-link";

type HomeCapacitySummaryProps = {
  stockTypeCount: number;
  stockTypeLimit: number;
};

const NEAR_LIMIT_THRESHOLD = 10;

function describeCapacity(remaining: number) {
  if (remaining <= 0) {
    return {
      barClass: "bg-app-primary",
      helperText: "한도에 도달했어요. 정리 후 등록해 주세요",
      helperClass: "text-app-primary",
    };
  }

  if (remaining <= NEAR_LIMIT_THRESHOLD) {
    return {
      barClass: "bg-app-warning",
      helperText: `${remaining}종 더 담을 수 있어요`,
      helperClass: "text-app-ink/55",
    };
  }

  return {
    barClass: "bg-app-ink",
    helperText: `${remaining}종 더 담을 수 있어요`,
    helperClass: "text-app-ink/55",
  };
}

export function HomeCapacitySummary({
  stockTypeCount,
  stockTypeLimit,
}: HomeCapacitySummaryProps) {
  const remaining = Math.max(stockTypeLimit - stockTypeCount, 0);
  const filledPercent = Math.min(
    Math.round((stockTypeCount / stockTypeLimit) * 100),
    100,
  );
  const capacity = describeCapacity(remaining);

  return (
    <section className="px-5 pt-6" aria-labelledby="home-capacity-heading">
      <div>
        <div className="flex items-end justify-between gap-3">
          <div className="min-w-0">
            <h2
              id="home-capacity-heading"
              className="mb-0 text-[12.5px] font-normal leading-tight tracking-normal text-app-ink/55"
            >
              보관 중인 재고 품목
            </h2>
            <p className="mb-0 mt-1 font-app-heading text-[22px] font-black leading-none text-app-ink">
              {stockTypeCount}
              <span className="text-[14px] font-bold text-app-ink/45">
                {" "}
                / {stockTypeLimit}종
              </span>
            </p>
          </div>

          <AppLink
            href={routes.refrigerator}
            className="flex-none py-1 text-[12.5px] font-bold text-app-ink no-underline hover:text-app-primary"
          >
            냉장고 열기 ›
          </AppLink>
        </div>

        <div
          role="progressbar"
          aria-labelledby="home-capacity-heading"
          aria-valuemin={0}
          aria-valuemax={stockTypeLimit}
          aria-valuenow={stockTypeCount}
          aria-valuetext={`${stockTypeLimit}종 중 ${stockTypeCount}종`}
          className="mt-3 h-2 w-full overflow-hidden bg-app-neutral-200"
        >
          <div
            className={`h-full ${capacity.barClass}`}
            style={{ width: `${filledPercent}%` }}
          />
        </div>

        <p
          className={`mb-0 mt-2 break-keep text-[12.5px] ${capacity.helperClass}`}
        >
          {capacity.helperText}
        </p>
      </div>
    </section>
  );
}
