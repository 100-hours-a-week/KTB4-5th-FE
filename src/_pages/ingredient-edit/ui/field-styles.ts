export const FIELD_LABEL_CLASS_NAME =
  "mb-0.5 block font-app-body text-xs font-bold leading-tight text-app-ink/50";

const FIELD_CONTROL_BASE_CLASS_NAME =
  "flex h-10 w-full items-center gap-1.5 border-b-[1.5px] bg-transparent px-0.5 text-left";

/** 등록일처럼 값만 보여주는 칸. 밑줄과 글자를 함께 흐리게 해 조작 대상이 아님을 알린다. */
export const FIELD_CONTROL_READONLY_CLASS_NAME = `${FIELD_CONTROL_BASE_CLASS_NAME} border-dashed border-app-ink/15 text-app-ink/40`;
