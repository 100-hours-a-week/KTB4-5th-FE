"use client";

import { QuestionMarkCircleOutlined } from "@lineiconshq/free-icons";
import { Lineicons } from "@lineiconshq/react-lineicons";
import { useState } from "react";

import { AppDialog } from "@/shared/ui/app-dialog";

const LIMIT_HELP_DESCRIPTION = [
  "① 재고가 바뀐 경우에만 새 추천이 자동으로 생성돼요. 요리를 적용해도 재고가 바뀌어 다음 진입 때 1회를 써요.",
  "② 기존 추천을 다시 보거나 정렬만 바꾸면 횟수가 줄지 않아요.",
  "③ 하루 한도에 도달하면 기존 추천을 계속 보여드려요.",
  "④ 새 추천은 다음 날 다시 생성돼요.",
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
        title="추천은 냉장고당 하루 10회 새로 만들어요"
        description={LIMIT_HELP_DESCRIPTION}
        primaryAction={{ label: "알겠어요", onClick: () => setOpen(false) }}
      />
    </>
  );
}
