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
      showTitle={false}
      description={`재료 ${ingredientId}의 정보와 삭제·만료 처리를 확인할 페이지입니다.`}
    />
  );
}
