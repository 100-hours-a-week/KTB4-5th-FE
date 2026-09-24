import type { ReactNode } from "react";

interface IngredientFormFieldsProps {
  nameField: ReactNode;
  storageField: ReactNode;
  quantityField: ReactNode;
  quantityHelper: ReactNode;
  weightField: ReactNode;
  weightHelper: ReactNode;
  expirationField: ReactNode;
  expirationHelper: ReactNode;
  footer?: ReactNode;
}

/**
 * 등록·수정 카드에서 공유하는 재료 입력 필드의 배치만 담당한다.
 * 필드 연결, 오류 문구, 화면별 추가 영역은 각 페이지가 slot으로 조합한다.
 */
export function IngredientFormFields({
  nameField,
  storageField,
  quantityField,
  quantityHelper,
  weightField,
  weightHelper,
  expirationField,
  expirationHelper,
  footer,
}: IngredientFormFieldsProps) {
  return (
    <div>
      {nameField}

      <div className="mt-3 grid grid-cols-2 gap-4">
        <div className="min-w-0">{storageField}</div>
        <div className="min-w-0">
          {quantityField}
          {quantityHelper}
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-4">
        <div className="min-w-0">
          {weightField}
          {weightHelper}
        </div>
        <div className="min-w-0">
          {expirationField}
          {expirationHelper}
        </div>
      </div>

      {footer ? (
        <div className="mt-3 border-t border-app-ink/15 pt-3.5">{footer}</div>
      ) : null}
    </div>
  );
}
