import {
  formatIngredientAmount,
  type Ingredient,
  IngredientExpiryStamp,
} from "@/entities/ingredient";
import { routes } from "@/shared/routes";
import { LinkCard } from "@/shared/ui/link-card";

type IngredientCardListProps = {
  ingredients: Ingredient[];
};

export function IngredientCardList({ ingredients }: IngredientCardListProps) {
  return (
    <ul className="flex flex-col gap-2">
      {ingredients.map((ingredient) => (
        <li key={ingredient.ingredientId}>
          <LinkCard
            href={routes.ingredientDetail(ingredient.ingredientId)}
            title={ingredient.name}
            description={formatIngredientAmount(ingredient)}
            trailing={
              <IngredientExpiryStamp
                status={ingredient.status}
                daysUntilExpiration={ingredient.daysUntilExpiration}
              />
            }
          />
        </li>
      ))}
    </ul>
  );
}
