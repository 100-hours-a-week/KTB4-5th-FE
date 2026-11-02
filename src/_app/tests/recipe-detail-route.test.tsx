import { afterEach, expect, it, vi } from "vitest";

import Page from "../../../app/(protected)/(flow)/recommendations/[recipeId]/page";
import { getRecipeDetail } from "@/entities/recommendation";
import { routes } from "@/shared/routes";

vi.mock("@/_pages/recipe-detail", () => ({ RecipeDetailPage: () => null }));
vi.mock("@lineiconshq/free-icons", () => ({ QuestionMarkCircleOutlined: {} }));
vi.mock("@lineiconshq/react-lineicons", () => ({ Lineicons: () => null }));

afterEach(() => vi.unstubAllGlobals());

it.each(["FOOD_SAFETY_KOREA:944", "RDA:51"])(
  "passes the original %s from the detail route and encodes the API URL once",
  async (recipeId) => {
    const href = routes.recipeDetail(recipeId, "123");
    const url = new URL(href, "http://localhost");
    const page = await Page({
      params: Promise.resolve({
        recipeId: url.pathname.slice("/recommendations/".length),
      }),
      searchParams: Promise.resolve({ recommendationId: "123" }),
    });
    expect(page.props).toMatchObject({ recipeId, recommendationId: "123" });

    const fetchMock = vi.fn<
      (path: string, init: RequestInit) => Promise<Response>
    >(async () =>
      Response.json(
        {
          code: "RECOMMEND-200-002",
          message: "OK",
          data: {
            recipeId,
            name: "요리",
            imageUrl: null,
            cookingTimeMinutes: null,
            targetServings: 2,
            expiringIngredientCount: null,
            ingredients: [],
            steps: [],
          },
        },
        { headers: { ETag: `"${"a".repeat(64)}"` } },
      ),
    );
    vi.stubGlobal("fetch", fetchMock);
    await getRecipeDetail("1", page.props.recipeId);
    expect(fetchMock.mock.calls[0]?.[0]).toBe(
      `/api/v1/refrigerators/1/recipes/${encodeURIComponent(recipeId)}`,
    );
  },
);
