export const FIELD_LABEL_CLASS_NAME =
  "mb-0.5 block font-app-body text-xs font-bold leading-tight text-app-ink/50";

const FIELD_CONTROL_BASE_CLASS_NAME =
  "flex h-10 w-full items-center gap-1.5 border-b-[1.5px] bg-transparent px-0.5 text-left";

export function getFieldControlClassName(hasError = false) {
  return `${FIELD_CONTROL_BASE_CLASS_NAME} ${
    hasError
      ? "border-app-primary"
      : "border-app-ink/25 focus-within:border-app-ink"
  }`;
}

export const FIELD_INPUT_CLASS_NAME =
  "min-w-0 flex-1 appearance-none border-0 bg-transparent p-0 font-app-mono text-[16px] font-bold leading-none text-app-ink outline-none placeholder:font-normal placeholder:text-app-ink/30";

export const FIELD_UNIT_CLASS_NAME =
  "flex-none font-app-body text-[12.5px] font-medium text-app-ink/55";
