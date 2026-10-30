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
    owned: z.number().int().nonnegative().nullable(),
    expiring: z.number().int().nonnegative().nullable(),
  }),
});
export const recommendationSchema = z.object({
  recommendationId: z.string().nullable(),
  status: z.enum(["READY", "STALE", "GENERATING", "EMPTY", "LIMIT_REACHED"]),
  generatedAt: z.string().nullable(),
  activeJobId: z.string().nullable(),
  dailyGeneration,
  recipes: z.array(recommendedRecipeSchema),
  generationTrigger: z.enum(["USER", "SCHEDULED"]).nullable().default(null),
  generationStatus: z
    .enum(["QUEUED", "PROCESSING", "COMPLETED", "FAILED"])
    .nullable()
    .default(null),
  hasNewRecommendation: z.boolean().default(false),
});
export type RecommendationJobRequest = {
  mode?: "INCLUDE_EXPIRED" | "EXCLUDE_EXPIRED";
  preferenceTags?: string[];
  targetServings?: number;
};
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
  targetServings: z.number().nullable(),
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
          usedAmount: z.number().nonnegative().nullable(),
          unit: amountUnit,
          expirationDate: z.iso.date(),
          allocationStatus: z.enum(["CALCULATED", "UNRESOLVED"]),
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
