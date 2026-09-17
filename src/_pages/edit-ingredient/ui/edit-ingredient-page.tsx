import { PagePlaceholder } from "@/shared/ui/page-placeholder";

type EditIngredientPageProps = {
  ingredientId: string;
};

export function EditIngredientPage({ ingredientId }: EditIngredientPageProps) {
  return (
    <PagePlaceholder
      screenId="STOCK-002 · edit"
      title="재고 수정"
      description={`재료 ${ingredientId}의 수량, 단위와 유통기한을 수정할 페이지입니다.`}
    />
  );
}
