const DIGITS = ["1", "2", "3", "4", "5", "6", "7", "8", "9"] as const;

type NumberKeypadProps = {
  onDigit: (digit: string) => void;
  onBackspace: () => void;
  backspaceDisabled?: boolean;
  disabled?: boolean;
};

const keyClasses =
  "inline-flex min-h-[54px] cursor-pointer items-center justify-center rounded-[27px] border border-app-ink/12 bg-white font-app-mono text-[20px] font-bold leading-none text-app-ink enabled:hover:bg-app-neutral-100 enabled:active:bg-app-neutral-200 disabled:cursor-not-allowed disabled:opacity-40";

/**
 * 숫자만 받는 입력에 붙이는 자체 키패드.
 * OS 키보드가 시트를 가리지 않도록 화면 안에서 숫자를 직접 받는다.
 */
export function NumberKeypad({
  onDigit,
  onBackspace,
  backspaceDisabled = false,
  disabled = false,
}: NumberKeypadProps) {
  return (
    <div className="grid grid-cols-3 gap-2.5">
      {DIGITS.map((digit) => (
        <button
          key={digit}
          type="button"
          onClick={() => onDigit(digit)}
          disabled={disabled}
          className={keyClasses}
        >
          {digit}
        </button>
      ))}
      <span aria-hidden="true" />
      <button
        type="button"
        onClick={() => onDigit("0")}
        disabled={disabled}
        className={keyClasses}
      >
        0
      </button>
      <button
        type="button"
        onClick={onBackspace}
        disabled={disabled || backspaceDisabled}
        aria-label="한 글자 지우기"
        className={`${keyClasses} border-transparent bg-app-neutral-100 text-[14px] font-normal text-app-ink/60`}
      >
        지우기
      </button>
    </div>
  );
}
