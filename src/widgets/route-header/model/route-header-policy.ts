import { routes } from "@/shared/routes";

export type RouteHeaderMode = "tabs" | "flow";

export type RouteHeaderPolicy =
  | {
      kind: "tabs";
      title: string;
      showNotifications: boolean;
    }
  | {
      kind: "flow";
      title: string;
      backFallbackHref: string;
    };

export type RouteHeaderTitleOverrides = {
  home?: string;
};

const tabHeaderTitles: Record<string, string> = {
  [routes.home]: "홈",
  [routes.refrigerator]: "냉장고",
  [routes.recommendations]: "추천",
  [routes.me]: "MY",
};

function getTabHeaderPolicy(
  pathname: string,
  titleOverrides: RouteHeaderTitleOverrides,
): RouteHeaderPolicy {
  const overriddenTitle =
    pathname === routes.home ? titleOverrides.home : undefined;

  return {
    kind: "tabs",
    title: overriddenTitle ?? tabHeaderTitles[pathname] ?? "다먹자",
    showNotifications: true,
  };
}

function getFlowHeaderPolicy(pathname: string): RouteHeaderPolicy {
  if (pathname === routes.notifications) {
    return {
      kind: "flow",
      title: "알림",
      backFallbackHref: routes.home,
    };
  }

  if (pathname === routes.registerIngredient) {
    return {
      kind: "flow",
      title: "재료 등록",
      backFallbackHref: routes.refrigerator,
    };
  }

  if (pathname === routes.registerIngredientManual) {
    return {
      kind: "flow",
      title: "직접 쓰기",
      backFallbackHref: routes.registerIngredient,
    };
  }

  if (pathname === routes.registerIngredientMergeResult) {
    return {
      kind: "flow",
      title: "합산 결과 확인",
      backFallbackHref: routes.registerIngredient,
    };
  }

  const ingredientEditMatch = pathname.match(
    /^\/refrigerator\/ingredients\/([^/]+)\/edit$/,
  );

  if (ingredientEditMatch) {
    const ingredientId = decodeURIComponent(ingredientEditMatch[1]);

    return {
      kind: "flow",
      title: "재고 수정",
      backFallbackHref: routes.ingredientDetail(ingredientId),
    };
  }

  if (/^\/refrigerator\/ingredients\/[^/]+$/.test(pathname)) {
    return {
      kind: "flow",
      title: "재고 상세",
      backFallbackHref: routes.refrigerator,
    };
  }

  return {
    kind: "flow",
    title: "다먹자",
    backFallbackHref: routes.home,
  };
}

export function getRouteHeaderPolicy(
  pathname: string,
  mode: RouteHeaderMode,
  titleOverrides: RouteHeaderTitleOverrides = {},
): RouteHeaderPolicy {
  return mode === "tabs"
    ? getTabHeaderPolicy(pathname, titleOverrides)
    : getFlowHeaderPolicy(pathname);
}
