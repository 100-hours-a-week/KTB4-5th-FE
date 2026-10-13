const SKELETON_COUNT = 7;

export function IngredientCardListSkeleton() {
  return (
    <ul
      role="status"
      aria-label="재고를 불러오는 중입니다"
      className="flex flex-col gap-2"
    >
      {Array.from({ length: SKELETON_COUNT }, (_, index) => (
        <li
          key={index}
          className="flex items-center gap-3 rounded-[4px] bg-white px-4 py-3 shadow-app-sm"
        >
          <span className="min-w-0 flex-1">
            <span className="block h-4 w-24 animate-pulse rounded-[4px] bg-app-ink/[0.06]" />
            <span className="mt-1.5 block h-3 w-16 animate-pulse rounded-[4px] bg-app-ink/[0.06]" />
          </span>
          <span className="size-12 flex-none animate-pulse rounded-full bg-app-ink/[0.06]" />
        </li>
      ))}
    </ul>
  );
}
