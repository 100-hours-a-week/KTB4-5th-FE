import { getMockIngredientEditTarget } from "../model/mock-ingredient-edit";
import { IngredientEditForm } from "./ingredient-edit-form";

type IngredientEditPageProps = {
  ingredientId: string;
};

export function IngredientEditPage({ ingredientId }: IngredientEditPageProps) {
  return (
    <IngredientEditForm target={getMockIngredientEditTarget(ingredientId)} />
  );
}
