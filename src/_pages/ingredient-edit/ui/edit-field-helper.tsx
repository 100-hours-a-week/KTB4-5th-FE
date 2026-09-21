type EditFieldHelperProps = {
  id: string;
  hint: string;
  error?: string;
};

/**
 * 수정 카드 안 입력칸 헬퍼다. 2열 칸(약 167px)에서도 위반 문구가 잘리지 않도록
 * 공용 FieldHelperText(14px, 말줄임)보다 작게 그리고 줄바꿈을 허용한다.
 * SERVICE_COMMON_RULES 5.1의 "항상 공간을 차지" 규칙에 따라 두 줄 높이를 잡아 둔다.
 */
export function EditFieldHelper({ id, hint, error }: EditFieldHelperProps) {
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
