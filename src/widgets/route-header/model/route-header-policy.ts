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

function getTabHeaderPolicy(): RouteHeaderPolicy {
  return {
    kind: "tabs",
    title: "다먹자",
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
): RouteHeaderPolicy {
  return mode === "tabs" ? getTabHeaderPolicy() : getFlowHeaderPolicy(pathname);
}
