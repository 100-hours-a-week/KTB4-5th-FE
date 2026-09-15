import { PagePlaceholder } from "@/shared/ui/page-placeholder";

type IngredientDetailPageProps = {
  ingredientId: string;
};

export function IngredientDetailPage({
  ingredientId,
}: IngredientDetailPageProps) {
  return (
    <PagePlaceholder
      screenId="STOCK-002 · v1"
      title="재고 상세"
      description={`재료 ${ingredientId}의 조회, 수정, 삭제와 만료 처리를 구현할 페이지입니다.`}
    />
  );
}
