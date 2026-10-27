import { z } from "zod";

const amountUnit = z.enum(["EA", "G", "ML"]);
const dailyGeneration = z.object({
  limit: z.number().int().nonnegative(),
  remaining: z.number().int().nonnegative(),
  resetAt: z.string(),
});
export const recommendedRecipeSchema = z.object({
  recipeId: z.string(),
  name: z.string(),
  imageUrl: z.string().nullable(),
  cookingTimeMinutes: z.number().nullable(),
  ingredientCounts: z.object({
    total: z.number().int().nonnegative(),
    owned: z.number().int().nonnegative(),
    expiring: z.number().int().nonnegative(),
  }),
});
export const recommendationSchema = z.object({
  recommendationId: z.string().nullable(),
  status: z.enum(["READY", "STALE", "GENERATING", "EMPTY", "LIMIT_REACHED"]),
  generatedAt: z.string().nullable(),
  activeJobId: z.string().nullable(),
  dailyGeneration,
  recipes: z.array(recommendedRecipeSchema),
});
export const recommendationJobSchema = z.union([
  z.object({
    jobId: z.string(),
    status: z.enum(["QUEUED", "RUNNING"]),
    mode: z.enum(["INCLUDE_EXPIRED", "EXCLUDE_EXPIRED"]),
    pollAfterMs: z.number(),
    dailyGeneration,
  }),
  z.object({
    jobId: z.null(),
    status: z.literal("ALREADY_UP_TO_DATE"),
    recommendationId: z.string(),
    dailyGeneration,
  }),
]);
export const recipeDetailSchema = z.object({
  recipeId: z.string(),
  name: z.string(),
  imageUrl: z.string().nullable(),
  cookingTimeMinutes: z.number().nullable(),
  baseServings: z.number().nullable(),
  expiringIngredientCount: z.number().int().nonnegative(),
  ingredients: z.array(
    z.object({
      recipeIngredientId: z.string(),
      name: z.string(),
      requiredAmount: z.number().nonnegative().nullable(),
      amountText: z.string(),
      unit: amountUnit.nullable(),
      stocks: z.array(
        z.object({
          ingredientId: z.string(),
          ownedAmount: z.number().nonnegative(),
          unit: amountUnit,
          expirationDate: z.iso.date(),
        }),
      ),
    }),
  ),
  steps: z.array(z.object({ stepNo: z.number(), instruction: z.string() })),
});
export type RecommendedRecipe = z.infer<typeof recommendedRecipeSchema>;
export type Recommendation = z.infer<typeof recommendationSchema>;
export type RecipeDetail = z.infer<typeof recipeDetailSchema>;
export type RecipeIngredient = RecipeDetail["ingredients"][number];
export type RecipeAmountUnit = z.infer<typeof amountUnit>;
