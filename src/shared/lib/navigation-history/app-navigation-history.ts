const APP_NAVIGATION_DEPTH_KEY = "__dameokjaNavigationDepth";

export type AppNavigationIntentType = "push" | "replace";

type AppNavigationIntent = {
  type: AppNavigationIntentType;
  destination: string;
};

let pendingNavigationIntent: AppNavigationIntent | null = null;

function getHistoryState() {
  const state: unknown = window.history.state;

  return typeof state === "object" && state !== null ? state : {};
}

function normalizeAppNavigationUrl(url: string) {
  const resolvedUrl = new URL(url, window.location.origin);

  return `${resolvedUrl.pathname}${resolvedUrl.search}`;
}

export function markAppNavigationIntent(
  type: AppNavigationIntentType,
  destination: string,
) {
  pendingNavigationIntent = {
    type,
    destination: normalizeAppNavigationUrl(destination),
  };
}

export function consumeAppNavigationIntent(destination: string) {
  const intent = pendingNavigationIntent;

  pendingNavigationIntent = null;

  if (
    intent === null ||
    intent.destination !== normalizeAppNavigationUrl(destination)
  ) {
    return null;
  }

  return intent.type;
}

export function readAppNavigationDepth() {
  const state = getHistoryState();
  const depth = Reflect.get(state, APP_NAVIGATION_DEPTH_KEY);

  return typeof depth === "number" && Number.isInteger(depth) && depth >= 0
    ? depth
    : null;
}

export function writeAppNavigationDepth(depth: number) {
  const state = getHistoryState();

  window.history.replaceState(
    { ...state, [APP_NAVIGATION_DEPTH_KEY]: depth },
    "",
  );
}
