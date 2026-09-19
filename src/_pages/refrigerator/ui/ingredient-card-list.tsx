import {
  formatDaysUntilExpiration,
  formatIngredientAmount,
  INGREDIENT_STATUS_BADGE_TONES,
  INGREDIENT_STATUS_LABELS,
  type Ingredient,
} from "@/entities/ingredient";
import { routes } from "@/shared/routes";
import { Badge } from "@/shared/ui/badge";
import { LinkCard } from "@/shared/ui/link-card";

type IngredientCardListProps = {
  ingredients: Ingredient[];
};

export function IngredientCardList({ ingredients }: IngredientCardListProps) {
  return (
    <ul className="flex flex-col gap-3">
      {ingredients.map((ingredient) => (
        <li key={ingredient.ingredientId}>
          <LinkCard
            href={routes.ingredientDetail(ingredient.ingredientId)}
            title={ingredient.name}
            description={formatIngredientAmount(ingredient)}
            trailing={
              <Badge tone={INGREDIENT_STATUS_BADGE_TONES[ingredient.status]}>
                {INGREDIENT_STATUS_LABELS[ingredient.status]}
              </Badge>
            }
            trailingCaption={formatDaysUntilExpiration(
              ingredient.daysUntilExpiration,
            )}
          />
        </li>
      ))}
    </ul>
  );
}
