import { PagePlaceholder } from "@/shared/ui/page-placeholder";
import { HomeDialogPreview } from "./home-dialog-preview";

export function HomePage() {
  return (
    <PagePlaceholder
      screenId="MAIN-001 · v1"
      title="홈"
      description="현재 냉장고의 재고와 유통기한 요약을 표시할 페이지입니다."
    >
      <HomeDialogPreview />
    </PagePlaceholder>
  );
}
