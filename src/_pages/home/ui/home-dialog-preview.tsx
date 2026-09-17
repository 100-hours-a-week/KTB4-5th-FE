"use client";

import { useState } from "react";
import { AppDialog } from "@/shared/ui/app-dialog";

export function HomeDialogPreview() {
  const [isOpen, setIsOpen] = useState(true);

  function closeDialog() {
    setIsOpen(false);
  }

  return (
    <>
      <button
        type="button"
        className="btn btn-secondary"
        onClick={() => setIsOpen(true)}
      >
        공용 모달 열기
      </button>
      <AppDialog
        open={isOpen}
        title="공용 모달을 확인할까요?"
        description="제목, 세부 설명과 두 개의 버튼으로 구성돼요."
        secondaryAction={{ label: "취소", onClick: closeDialog }}
        primaryAction={{ label: "확인", onClick: closeDialog }}
      />
    </>
  );
}
