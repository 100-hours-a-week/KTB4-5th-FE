interface IngredientFieldHelperProps {
  id: string;
  hint: string;
  error?: string;
}

/**
 * 재료 카드의 2열 필드 아래에서 입력 규칙과 오류를 표시한다.
 * 두 줄 높이를 항상 유지해 오류가 나타날 때 아래 레이아웃이 움직이지 않게 한다.
 */
export function IngredientFieldHelper({
  id,
  hint,
  error,
}: IngredientFieldHelperProps) {
  return (
    <p
      id={id}
      aria-live="polite"
      aria-atomic="true"
      className={`m-0 mt-1 min-h-8 break-keep text-[12px] leading-4 ${
        error ? "text-app-primary" : "text-app-ink/50"
      }`}
    >
      {error ?? hint}
    </p>
  );
}
