"use client";

import { QuestionMarkCircleOutlined } from "@lineiconshq/free-icons";
import { Lineicons } from "@lineiconshq/react-lineicons";
import { useState } from "react";

import { AppDialog } from "@/shared/ui/app-dialog";

const LIMIT_HELP_DESCRIPTION = [
  "① 취향을 선택해 추천을 요청하면 생성 횟수를 사용해요. 목록을 열거나 요리를 적용하는 것만으로 새 추천을 만들지는 않아요.",
  "② 기존 추천을 다시 보거나 정렬만 바꾸면 횟수가 줄지 않아요.",
  "③ 하루 한도에 도달하면 기존 추천을 계속 보여드려요.",
  "④ 생성 횟수는 매일 자정(한국 시간)에 초기화돼요.",
].join("\n");

export function RecommendationLimitHelpButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        aria-label="추천 생성 한도 안내"
        onClick={() => setOpen(true)}
        className="grid size-[var(--tap-min)] place-items-center border-0 bg-transparent p-0 text-app-text hover:text-app-primary"
      >
        <Lineicons
          icon={QuestionMarkCircleOutlined}
          size={22}
          strokeWidth={1.8}
          aria-hidden="true"
          focusable="false"
        />
      </button>
      <AppDialog
        open={open}
        title="추천은 사용자당 하루 10회 새로 만들어요"
        description={LIMIT_HELP_DESCRIPTION}
        primaryAction={{ label: "알겠어요", onClick: () => setOpen(false) }}
      />
    </>
  );
}
