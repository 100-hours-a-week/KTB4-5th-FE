import type { IngredientStatus } from "@/entities/ingredient";
import { NotePaper } from "@/shared/ui/note-paper";

type IngredientMemoNoteProps = {
  status: IngredientStatus;
};

const memoMessages = {
  NORMAL: "유통기한까지 4일 이상 남아 여유로워요. D-3부터 알림에 올라와요.",
  EXPIRING_SOON: "임박(D-3 이내) 재료는 매일 오전 8시 알림에 올라와요.",
  EXPIRED: "먹었거나 버렸다면 만료 처리로 정리해 주세요.",
} satisfies Record<IngredientStatus, string>;

export function IngredientMemoNote({ status }: IngredientMemoNoteProps) {
  return (
    <section
      aria-labelledby="ingredient-memo-title"
      className="relative z-[3] px-5 pb-4 pt-[26px]"
    >
      <NotePaper foldSize={34}>
        <div className="px-4 pt-3 pb-4">
          <div className="mb-2 flex items-center justify-between">
            <h3
              id="ingredient-memo-title"
              className="m-0 font-app-body text-[11.5px] font-bold leading-tight tracking-[0.08em] text-app-ink/65"
            >
              메모
            </h3>
          </div>

          <p className="m-0 text-[13px] leading-[1.55] text-app-ink/70">
            {memoMessages[status]}
          </p>
        </div>
      </NotePaper>
    </section>
  );
}
