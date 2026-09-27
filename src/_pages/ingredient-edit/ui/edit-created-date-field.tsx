import { Locked2Outlined } from "@lineiconshq/free-icons";
import { Lineicons } from "@lineiconshq/react-lineicons";

import { formatIsoDate } from "@/shared/lib/date";

import {
  FIELD_CONTROL_READONLY_CLASS_NAME,
  FIELD_LABEL_CLASS_NAME,
} from "./field-styles";

type EditCreatedDateFieldProps = {
  id: string;
  createdDate: string;
};

// 등록일은 수정 대상이 아니다. 조작할 수 없는 칸으로 값만 보여준다.
export function EditCreatedDateField({
  id,
  createdDate,
}: EditCreatedDateFieldProps) {
  return (
    <div>
      <span id={`${id}-label`} className={FIELD_LABEL_CLASS_NAME}>
        등록일
      </span>
      <p
        id={id}
        aria-labelledby={`${id}-label`}
        aria-disabled="true"
        className={`m-0 ${FIELD_CONTROL_READONLY_CLASS_NAME}`}
      >
        <span className="min-w-0 flex-1 truncate font-app-mono text-[15px] font-bold">
          {formatIsoDate(createdDate)}
        </span>
        <Lineicons
          icon={Locked2Outlined}
          size={13}
          strokeWidth={2}
          aria-hidden="true"
          focusable="false"
          className="flex-none"
        />
      </p>
      <p className="m-0 mt-1 min-h-8 break-keep text-[12px] leading-4 text-app-ink/40">
        등록일은 바꿀 수 없어요
      </p>
    </div>
  );
}
