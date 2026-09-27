type FieldHelperTextProps = {
  id: string;
  hint: string;
  error?: string;
};

export function FieldHelperText({ id, hint, error }: FieldHelperTextProps) {
  return (
    <p
      id={id}
      aria-live="polite"
      aria-atomic="true"
      className={`mb-0 mt-1 min-h-5 truncate text-sm leading-5 ${error ? "text-app-primary" : "text-app-ink/50"}`}
    >
      {error ?? hint}
    </p>
  );
}
