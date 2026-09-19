"use client";

import {
  hasIngredientListCondition,
  type Ingredient,
  type IngredientListQuery,
} from "@/entities/ingredient";

import { useIngredientListNavigation } from "../model/use-ingredient-list-navigation";
import { IngredientCardList } from "./ingredient-card-list";
import { IngredientListEmpty } from "./ingredient-list-empty";

type IngredientListContainerProps = {
  query: IngredientListQuery;
  ingredients: Ingredient[];
};

// TODO: API 연동 단계에서 ingredients는 같은 Query Key를 구독하는 useInfiniteQuery의 data.pages를 평탄화한 값으로 바뀐다.
export function IngredientListContainer({
  ingredients,
  query,
}: IngredientListContainerProps) {
  const updateQuery = useIngredientListNavigation(query);

  if (ingredients.length === 0) {
    return (
      <IngredientListEmpty
        hasCondition={hasIngredientListCondition(query)}
        onResetCondition={() => updateQuery({ filter: null })}
      />
    );
  }

  return <IngredientCardList ingredients={ingredients} />;
}
