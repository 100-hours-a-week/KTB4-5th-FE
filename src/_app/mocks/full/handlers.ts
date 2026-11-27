import { http, HttpResponse } from "msw";

import { getTodayInSeoul } from "@/shared/lib/seoul-date";

import { mockProblem, mockSuccess } from "../recommendation/handlers";

type MockIngredient = {
  ingredientId: string;
  name: string;
  category: string;
  storageType: "REFRIGERATED" | "FROZEN";
  quantity: number | null;
  weightValue: number | null;
  weightUnit: "NONE" | "G" | "ML";
  expirationDate: string;
  createdDate: string;
};

type MockRegisterItem = {
  name: string;
  category: string;
  storageType: "REFRIGERATED" | "FROZEN";
  quantity: number | null;
  weightValue: number | null;
  weightUnit: "NONE" | "G" | "ML";
  expirationDate: string;
};

const DAY_MS = 86_400_000;
const REFRIGERATOR_CAPACITY = 1500;
const SESSION_COOKIES = [
  "accessToken=local-msw-only; Path=/; SameSite=Lax",
  "refreshToken=local-msw-only; Path=/; SameSite=Lax",
];
const VAPID_PUBLIC_KEY =
  "BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U";

const dateAfter = (days: number) =>
  new Date(Date.parse(getTodayInSeoul()) + days * DAY_MS)
    .toISOString()
    .slice(0, 10);
const daysUntil = (date: string) =>
  Math.round((Date.parse(date) - Date.parse(getTodayInSeoul())) / DAY_MS);
const statusOf = (date: string) => {
  const days = daysUntil(date);
  return days < 0 ? "EXPIRED" : days <= 3 ? "EXPIRING_SOON" : "NORMAL";
};
const noContent = (headers?: HeadersInit) =>
  new HttpResponse(null, { status: 204, headers });

export function createFullHandlers() {
  const root = "*/api/v1/refrigerators/:refrigeratorId";
  let nextId = 200;
  const me = {
    userId: "1",
    nickname: "다먹자",
    email: "mock@dameokja.dev",
    profileImageUrl: null as string | null,
    cookingCount: 3,
  };
  const refrigerator = { refrigeratorId: 1, name: "우리집 냉장고" };
  const members = [
    { userId: "1", nickname: "다먹자", profileImage: "", role: "owner" },
    { userId: "2", nickname: "냉장고메이트", profileImage: "", role: "member" },
  ];
  let invitation: { code: string; expiresAt: string } | null = null;
  const preferences = [
    { type: "EXPIRATION", isEnabled: true },
    { type: "RECIPE", isEnabled: false },
  ];
  const ingredients: MockIngredient[] = [
    ["우유", "DAIRY", "REFRIGERATED", 1, null, "NONE", -2],
    ["두부", "TOFU_BEAN", "REFRIGERATED", 2, null, "NONE", 0],
    ["달걀", "DAIRY", "REFRIGERATED", 10, null, "NONE", 2],
    ["삼겹살", "MEAT", "FROZEN", null, 600, "G", 20],
    ["대파", "VEGETABLE", "REFRIGERATED", 3, null, "NONE", 6],
    ["사과", "FRUIT", "REFRIGERATED", 4, null, "NONE", 12],
    ["고등어", "SEAFOOD", "FROZEN", 2, null, "NONE", 30],
    ["간장", "SEASONING", "REFRIGERATED", null, 500, "ML", 180],
  ].map(
    (
      [name, category, storageType, quantity, weightValue, weightUnit, days],
      i,
    ) =>
      ({
        ingredientId: String(101 + i),
        name,
        category,
        storageType,
        quantity,
        weightValue,
        weightUnit,
        expirationDate: dateAfter(days as number),
        createdDate: dateAfter(-i),
      }) as MockIngredient,
  );
  const notifications = [
    [
      "EXPIRED",
      "우유 유통기한이 지났어요",
      "먹었거나 버렸다면 정리해 주세요.",
      false,
    ],
    [
      "EXPIRING_SOON",
      "두부 유통기한이 오늘까지예요",
      "오늘 안에 드세요.",
      false,
    ],
    ["MEMBER", "냉장고메이트님이 참여했어요", "함께 냉장고를 관리해요.", true],
  ].map(([type, title, body, read], i) => ({
    notificationId: String(301 + i),
    type: type as string,
    title: title as string,
    body: body as string,
    readAt: read ? new Date().toISOString() : (null as string | null),
    createdAt: new Date(Date.now() - i * 3_600_000).toISOString(),
  }));
  const analyses = new Map<
    string,
    { analysisId: string; submittedAt: string; imageObjectKeys: string[] }
  >();

  const toListItem = (ingredient: MockIngredient) => ({
    ingredientId: ingredient.ingredientId,
    name: ingredient.name,
    category: ingredient.category,
    quantity: ingredient.quantity,
    weightValue:
      ingredient.weightValue === null ? null : String(ingredient.weightValue),
    weightUnit: ingredient.weightUnit,
    storageType: ingredient.storageType,
    status: statusOf(ingredient.expirationDate),
    daysUntilExpiration: daysUntil(ingredient.expirationDate),
  });
  const toDetail = (ingredient: MockIngredient) => ({
    ...toListItem(ingredient),
    measureType: ingredient.weightUnit === "NONE" ? "COUNT" : "WEIGHT",
    expirationDate: ingredient.expirationDate,
    createdDate: ingredient.createdDate,
  });
  const etagOf = (ingredient: MockIngredient) =>
    `"${encodeURIComponent(JSON.stringify(ingredient))}"`;
  const findIngredient = (id: unknown) =>
    ingredients.find((ingredient) => ingredient.ingredientId === String(id));
  const listIngredients = (url: URL, expiredOnly = false) => {
    const filter = expiredOnly ? "EXPIRED" : url.searchParams.get("filter");
    const category = url.searchParams.get("category");
    const keyword = url.searchParams.get("keyword");
    const sort = url.searchParams.get("sort") ?? "EXPIRATION_ASC";
    const size = expiredOnly
      ? REFRIGERATOR_CAPACITY
      : Number(url.searchParams.get("size") ?? 10);
    const offset = Number(url.searchParams.get("cursor") ?? 0);
    const filtered = ingredients
      .filter(
        (ingredient) =>
          (!filter ||
            filter === ingredient.storageType ||
            filter === statusOf(ingredient.expirationDate)) &&
          (!category || category === ingredient.category) &&
          (!keyword || ingredient.name.includes(keyword)),
      )
      .toSorted((a, b) =>
        sort === "NAME_ASC"
          ? a.name.localeCompare(b.name)
          : sort === "CREATED_DESC"
            ? b.createdDate.localeCompare(a.createdDate)
            : a.expirationDate.localeCompare(b.expirationDate),
      );
    const page = filtered.slice(offset, offset + size);
    return {
      baseDate: getTodayInSeoul(),
      outdated: false,
      refrigeratorName: refrigerator.name,
      ingredientsNum: ingredients.length,
      filteredCount: filtered.length,
      refrigeratorCapacity: REFRIGERATOR_CAPACITY,
      ingredients: page.map(toListItem),
      nextCursor:
        offset + size < filtered.length ? String(offset + size) : null,
    };
  };
  const register = (items: MockRegisterItem[]) => {
    const mergedItems = [];
    let createdCount = 0;
    for (const item of items) {
      const same = ingredients.find(
        (ingredient) =>
          ingredient.name === item.name &&
          ingredient.storageType === item.storageType &&
          ingredient.expirationDate === item.expirationDate &&
          ingredient.weightUnit === item.weightUnit,
      );
      if (!same) {
        createdCount += 1;
        ingredients.push({
          ...item,
          ingredientId: String(nextId++),
          createdDate: getTodayInSeoul(),
        });
        continue;
      }
      const count = same.weightUnit === "NONE";
      const previousQuantity = same.quantity;
      const previousWeightValue = same.weightValue;
      if (count) same.quantity = (same.quantity ?? 0) + (item.quantity ?? 0);
      else same.weightValue = (same.weightValue ?? 0) + (item.weightValue ?? 0);
      mergedItems.push({
        ingredientId: Number(same.ingredientId),
        name: same.name,
        measureType: count ? "COUNT" : "WEIGHT",
        previousQuantity: count ? previousQuantity : null,
        addedQuantity: count ? item.quantity : null,
        totalQuantity: count ? same.quantity : null,
        previousWeightValue: count ? null : String(previousWeightValue),
        addedWeightValue: count ? null : String(item.weightValue),
        totalWeightValue: count ? null : String(same.weightValue),
        weightUnit: same.weightUnit,
      });
    }
    return {
      createdCount,
      mergedCount: mergedItems.length,
      ingredientsNum: ingredients.length,
      refrigeratorCapacity: REFRIGERATOR_CAPACITY,
      mergedItems,
    };
  };
  const analysisDetail = (analysis: {
    analysisId: string;
    submittedAt: string;
    imageObjectKeys: string[];
  }) => ({
    analysisId: analysis.analysisId,
    status: "COMPLETED",
    submittedAt: analysis.submittedAt,
    expiresAt: new Date(
      Date.parse(analysis.submittedAt) + DAY_MS,
    ).toISOString(),
    pollAfterMs: null,
    error: null,
    results: analysis.imageObjectKeys.map((imageObjectKey, i) => ({
      imageObjectKey,
      status: "COMPLETED",
      recognitionStatus: "RECOGNIZED",
      documentType: "RECEIPT",
      error: null,
      items: [
        ["양파", "VEGETABLE", 3, 10],
        ["요거트", "DAIRY", 4, 7],
      ].map(([name, category, quantity, days], j) => ({
        itemId: `${analysis.analysisId}-${i}-${j}`,
        displayStatus: "RECOGNIZED",
        name,
        category,
        storageType: "REFRIGERATED",
        measureType: "COUNT",
        quantity,
        weight: null,
        expiration: {
          date: dateAfter(days as number),
          dateType: "USE_BY",
          estimatedRange: null,
        },
        reviewReasons: [],
      })),
    })),
  });

  return [
    http.post("*/api/v1/auth/sessions", () =>
      HttpResponse.json(
        {
          code: "AUTH-200-001",
          message: "요청 성공",
          data: {
            activeRefrigeratorIds: [String(refrigerator.refrigeratorId)],
          },
        },
        { headers: SESSION_COOKIES.map((c) => ["Set-Cookie", c]) },
      ),
    ),
    http.delete("*/api/v1/auth/sessions", () =>
      HttpResponse.json(
        { code: "AUTH-200-002", message: "요청 성공", data: null },
        {
          headers: ["accessToken", "refreshToken"].map((name) => [
            "Set-Cookie",
            `${name}=; Path=/; Max-Age=0`,
          ]),
        },
      ),
    ),
    http.post("*/api/v1/auth/token-renewals", () =>
      noContent(SESSION_COOKIES.map((c) => ["Set-Cookie", c])),
    ),
    http.get("*/api/v1/users/me", () => mockSuccess("USER-200-001", me)),
    http.patch("*/api/v1/users/me", async ({ request }) => {
      const body = (await request.json()) as {
        nickname: string;
        profileImage?: string | null;
      };
      me.nickname = body.nickname;
      if (body.profileImage !== undefined) {
        me.profileImageUrl = body.profileImage
          ? `https://picsum.photos/seed/${encodeURIComponent(body.profileImage)}/200`
          : null;
      }
      members[0].nickname = me.nickname;
      return mockSuccess("USER-200-002", {
        userId: me.userId,
        nickname: me.nickname,
        profileImageUrl: me.profileImageUrl,
      });
    }),
    http.delete("*/api/v1/users/me", () => noContent()),
    http.post("*/api/v1/users/oauth", () =>
      HttpResponse.json(
        {
          code: "USER-201-001",
          message: "요청 성공",
          data: {
            activeRefrigeratorIds: [String(refrigerator.refrigeratorId)],
          },
        },
        { status: 201, headers: SESSION_COOKIES.map((c) => ["Set-Cookie", c]) },
      ),
    ),
    http.post("*/api/v1/users/nickname-validations", () =>
      mockSuccess("USER-200-003", { valid: true, reason: null }),
    ),
    http.get("*/api/v1/refrigerators/current", () =>
      mockSuccess("REFRIGERATOR-200-001", [
        {
          ...refrigerator,
          capacity: REFRIGERATOR_CAPACITY,
          expiredCount: ingredients.filter(
            (ingredient) => statusOf(ingredient.expirationDate) === "EXPIRED",
          ).length,
        },
      ]),
    ),
    http.post("*/api/v1/refrigerators/members", () =>
      mockSuccess("REFRIGERATOR-200-002", {
        refrigeratorId: refrigerator.refrigeratorId,
      }),
    ),
    http.get(`${root}/members`, () =>
      mockSuccess("REFRIGERATOR-200-003", {
        currentUserId: me.userId,
        refrigeratorName: refrigerator.name,
        memberNum: members.length,
        memberMax: 150,
        members,
      }),
    ),
    http.delete(`${root}/members/me`, () =>
      mockSuccess("REFRIGERATOR-200-004", {
        activeRefrigeratorIds: [String(refrigerator.refrigeratorId)],
      }),
    ),
    http.delete(`${root}/members/:userId`, ({ params }) => {
      const index = members.findIndex((m) => m.userId === params.userId);
      if (index < 1) return mockProblem(404, "REFRIGERATOR-404-002");
      members.splice(index, 1);
      return noContent();
    }),
    http.get(`${root}/invitations`, () =>
      mockSuccess("REFRIGERATOR-200-005", invitation),
    ),
    http.post(`${root}/invitations`, () => {
      invitation = {
        code: "MOCK2026",
        expiresAt: new Date(Date.now() + DAY_MS).toISOString(),
      };
      return mockSuccess(
        "REFRIGERATOR-201-001",
        { code: invitation.code },
        201,
      );
    }),
    http.get(`${root}/mypage`, () =>
      mockSuccess("REFRIGERATOR-200-006", {
        userId: me.userId,
        nickname: me.nickname,
        email: me.email,
        profileImageUrl: me.profileImageUrl,
        refrigeratorId: String(refrigerator.refrigeratorId),
        refrigeratorName: refrigerator.name,
        ingredientsNum: ingredients.length,
        expiredIngredientsNum: ingredients.filter(
          (ingredient) => statusOf(ingredient.expirationDate) === "EXPIRED",
        ).length,
        memberNum: members.length,
        notificationPreferences: preferences,
      }),
    ),
    http.get(`${root}/ingredients`, ({ request }) =>
      mockSuccess("INGREDIENT-200-001", listIngredients(new URL(request.url))),
    ),
    http.get(
      "*/refrigerators/:refrigeratorId/expired-ingredients",
      ({ request }) =>
        mockSuccess(
          "INGREDIENT-200-001",
          listIngredients(new URL(request.url), true),
        ),
    ),
    http.post(`${root}/ingredients`, async ({ request }) => {
      const { items } = (await request.json()) as { items: MockRegisterItem[] };
      return mockSuccess("INGREDIENT-201-001", register(items), 201);
    }),
    http.post(`${root}/ingredients/from-analysis`, async ({ request }) => {
      const body = (await request.json()) as {
        analysisId: string;
        images: {
          items: (Omit<
            MockRegisterItem,
            "weightValue" | "weightUnit" | "expirationDate"
          > & {
            weight: { value: number; unit: "G" | "ML" } | null;
            expiration: string;
          })[];
        }[];
      };
      analyses.delete(body.analysisId);
      return mockSuccess(
        "INGREDIENT-201-001",
        register(
          body.images.flatMap((image) =>
            image.items.map(({ weight, expiration, ...item }) => ({
              ...item,
              quantity: weight ? null : item.quantity,
              weightValue: weight?.value ?? null,
              weightUnit: weight?.unit ?? "NONE",
              expirationDate: expiration,
            })),
          ),
        ),
        201,
      );
    }),
    http.post(`${root}/ingredients/expired`, async ({ request }) => {
      const { ingredientIds } = (await request.json()) as {
        ingredientIds: number[];
      };
      for (const id of ingredientIds) {
        const index = ingredients.findIndex(
          (ingredient) =>
            ingredient.ingredientId === String(id) &&
            daysUntil(ingredient.expirationDate) < 0,
        );
        if (index >= 0) ingredients.splice(index, 1);
      }
      return noContent();
    }),
    http.get("*/api/v1/ingredients/:ingredientId", ({ params }) => {
      const ingredient = findIngredient(params.ingredientId);
      if (!ingredient) return mockProblem(404, "INGREDIENT-404-001");
      return HttpResponse.json(
        {
          code: "INGREDIENT-200-002",
          message: "요청 성공",
          data: {
            ...toDetail(ingredient),
            baseDate: getTodayInSeoul(),
            ownerNickname: me.nickname,
          },
        },
        { headers: { ETag: etagOf(ingredient) } },
      );
    }),
    http.patch(
      "*/api/v1/ingredients/:ingredientId",
      async ({ params, request }) => {
        const ingredient = findIngredient(params.ingredientId);
        if (!ingredient) return mockProblem(404, "INGREDIENT-404-001");
        if (request.headers.get("If-Match") !== etagOf(ingredient))
          return mockProblem(412, "INGREDIENT-412-001");
        const body = (await request.json()) as Partial<
          Omit<MockIngredient, "weightValue"> & { weightValue: string }
        >;
        Object.assign(ingredient, {
          ...body,
          ...(body.weightValue !== undefined && {
            weightValue: Number(body.weightValue),
          }),
        });
        return HttpResponse.json(
          {
            code: "INGREDIENT-200-003",
            message: "요청 성공",
            data: { ...toDetail(ingredient), mergedItems: [] },
          },
          { headers: { ETag: etagOf(ingredient) } },
        );
      },
    ),
    http.post(
      "*/api/v1/ingredients/:ingredientId",
      async ({ params, request }) => {
        const ingredient = findIngredient(params.ingredientId);
        if (!ingredient) return mockProblem(404, "INGREDIENT-404-001");
        if (request.headers.get("If-Match") !== etagOf(ingredient))
          return mockProblem(412, "INGREDIENT-412-001");
        const body = (await request.json()) as {
          quantity?: number;
          weightValue?: string;
        };
        if (body.quantity !== undefined)
          ingredient.quantity = (ingredient.quantity ?? 0) - body.quantity;
        if (body.weightValue !== undefined)
          ingredient.weightValue =
            (ingredient.weightValue ?? 0) - Number(body.weightValue);
        const removed =
          (ingredient.quantity ?? ingredient.weightValue ?? 0) <= 0;
        if (removed) ingredients.splice(ingredients.indexOf(ingredient), 1);
        return mockSuccess("INGREDIENT-200-004", { removed });
      },
    ),
    http.post("*/api/v1/image/presigned-url", () => {
      const objectKey = `mock/${crypto.randomUUID()}`;
      return mockSuccess("IMAGE-200-002", {
        objectKey,
        uploadUrl: `/mock-storage/${objectKey}`,
        method: "PUT",
        headers: {},
        expiresAt: new Date(Date.now() + 600_000).toISOString(),
      });
    }),
    http.put("*/mock-storage/*", () => new HttpResponse(null, { status: 200 })),
    http.get("*/api/v1/image-analyses", () =>
      mockSuccess("IMAGE-200-001", {
        analyses: [...analyses.values()].map((analysis) => {
          const { results, ...detail } = analysisDetail(analysis);
          return {
            ...detail,
            totalImageCount: results.length,
            completedImageCount: results.length,
            failedImageCount: 0,
            images: results.map((result) => ({
              imageObjectKey: result.imageObjectKey,
              status: result.status,
              itemCount: result.items.length,
            })),
          };
        }),
      }),
    ),
    http.post("*/api/v1/image-analyses", async ({ request }) => {
      const { imageObjectKeys } = (await request.json()) as {
        imageObjectKeys: string[];
      };
      const analysis = {
        analysisId: `ana_${nextId++}`,
        submittedAt: new Date().toISOString(),
        imageObjectKeys,
      };
      analyses.set(analysis.analysisId, analysis);
      return mockSuccess(
        "IMAGE-202-001",
        {
          analysisId: analysis.analysisId,
          status: "QUEUED",
          submittedAt: analysis.submittedAt,
          expiresAt: null,
          pollAfterMs: 1000,
        },
        202,
      );
    }),
    http.get("*/api/v1/image-analyses/:analysisId", ({ params }) => {
      const analysis = analyses.get(String(params.analysisId));
      if (!analysis) return mockProblem(404, "IMAGE-404-001");
      return mockSuccess("IMAGE-200-003", analysisDetail(analysis));
    }),
    http.delete("*/api/v1/image-analyses/:analysisId", ({ params }) => {
      analyses.delete(String(params.analysisId));
      return noContent();
    }),
    http.get(`${root}/notifications`, ({ request }) => {
      const type = new URL(request.url).searchParams.get("type");
      return mockSuccess("NOTIFICATION-200-002", {
        expiredIngredientsNum: ingredients.filter(
          (ingredient) => statusOf(ingredient.expirationDate) === "EXPIRED",
        ).length,
        notifications: notifications.filter(
          (n) =>
            type === "ALL" ||
            !type ||
            (type === "READ" ? n.readAt !== null : n.readAt === null),
        ),
        nextCursor: null,
        hasNext: false,
      });
    }),
    http.get(`${root}/notifications/unread-count`, ({ params }) =>
      mockSuccess("NOTIFICATION-200-001", {
        refrigeratorId: params.refrigeratorId,
        unreadCount: notifications.filter((n) => n.readAt === null).length,
      }),
    ),
    http.patch("*/api/v1/notifications/:notificationId/read", ({ params }) => {
      const notification = notifications.find(
        (n) => n.notificationId === params.notificationId,
      );
      if (notification) notification.readAt ??= new Date().toISOString();
      return noContent();
    }),
    http.patch(`${root}/notifications/read-all`, () => {
      for (const n of notifications) n.readAt ??= new Date().toISOString();
      return noContent();
    }),
    http.get("*/api/v1/notifications/settings", () =>
      mockSuccess("NOTIFICATION-200-003", {
        notificationPreferences: preferences,
      }),
    ),
    http.patch("*/api/v1/notifications/settings", async ({ request }) => {
      const body = (await request.json()) as {
        notificationPreferences: { type: string; isEnabled: boolean }[];
      };
      for (const { type, isEnabled } of body.notificationPreferences) {
        const preference = preferences.find((p) => p.type === type);
        if (preference) preference.isEnabled = isEnabled;
      }
      return mockSuccess("NOTIFICATION-200-004", {
        notificationPreferences: preferences,
      });
    }),
    http.get("*/api/v1/push-subscriptions/vapid-public-key", () =>
      mockSuccess("PUSH-200-001", { vapidPublicKey: VAPID_PUBLIC_KEY }),
    ),
    http.post("*/api/v1/push-subscriptions", () =>
      mockSuccess("PUSH-201-001", { subscriptionId: "1" }, 201),
    ),
    http.delete("*/api/v1/push-subscriptions/:subscriptionId", () =>
      noContent(),
    ),
    http.post("*/bug-reports", () => mockSuccess("REPORT-201-001", null, 201)),
  ];
}
