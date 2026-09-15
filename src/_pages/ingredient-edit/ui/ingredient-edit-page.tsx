import { PagePlaceholder } from "@/shared/ui/page-placeholder";

type IngredientEditPageProps = {
  ingredientId: string;
};

export function IngredientEditPage({ ingredientId }: IngredientEditPageProps) {
  return (
    <PagePlaceholder
      screenId="STOCK-002 · v1"
      title="재고 수정"
      description={`재료 ${ingredientId}의 수량, 단위와 유통기한을 수정할 페이지입니다.`}
    />
  );
}
