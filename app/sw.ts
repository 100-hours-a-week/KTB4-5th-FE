/// <reference lib="esnext" />
/// <reference lib="webworker" />

import { defaultCache } from "@serwist/turbopack/worker";
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import { disableNavigationPreload, NetworkOnly, Serwist } from "serwist";

import { routes } from "@/shared/routes";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

type PushNotificationPayload = {
  body?: string;
  data?: {
    url?: string;
  };
  icon?: string;
  message?: string;
  tag?: string;
  title?: string;
  url?: string;
};

const DEFAULT_NOTIFICATION_URL = routes.notifications;

function isPushNotificationPayload(
  value: unknown,
): value is PushNotificationPayload {
  return typeof value === "object" && value !== null;
}

function readPushPayload(
  data: PushMessageData | null,
): PushNotificationPayload {
  if (!data) {
    return {};
  }

  try {
    const value: unknown = data.json();

    if (isPushNotificationPayload(value)) {
      return value;
    }
  } catch {
    return { body: data.text() };
  }

  return {};
}

function getSameOriginUrl(candidate: unknown): string {
  if (typeof candidate !== "string") {
    return new URL(DEFAULT_NOTIFICATION_URL, self.location.origin).href;
  }

  try {
    const url = new URL(candidate, self.location.origin);

    return url.origin === self.location.origin
      ? url.href
      : new URL(DEFAULT_NOTIFICATION_URL, self.location.origin).href;
  } catch {
    return new URL(DEFAULT_NOTIFICATION_URL, self.location.origin).href;
  }
}

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  runtimeCaching:
    process.env.NODE_ENV === "development"
      ? []
      : [
          {
            matcher: ({ sameOrigin, request, url: { pathname } }) =>
              sameOrigin &&
              (pathname.startsWith("/api/") ||
                pathname.startsWith("/_next/data/") ||
                request.mode === "navigate" ||
                request.headers.has("RSC") ||
                (pathname.startsWith("/refrigerators/") &&
                  pathname.endsWith("/expired-ingredients"))),
            method: "GET",
            handler: new NetworkOnly({ fetchOptions: { cache: "no-store" } }),
          },
          ...defaultCache,
        ],
  fallbacks: {
    entries: [
      {
        url: routes.offline,
        matcher: ({ request }) => request.destination === "document",
      },
    ],
  },
});

self.addEventListener("activate", (event) => {
  // 이전 워커가 저장한 사용자 응답은 새 캐시 정책만으로 제거되지 않는다.
  event.waitUntil(
    Promise.all(
      [
        "apis",
        "pages",
        "pages-rsc",
        "pages-rsc-prefetch",
        "next-data",
        "others",
      ].map((name) => caches.delete(name)),
    ),
  );
});

self.addEventListener("push", (event) => {
  const payload = readPushPayload(event.data);
  const notificationUrl = getSameOriginUrl(
    payload.data?.url ?? payload.url ?? DEFAULT_NOTIFICATION_URL,
  );

  event.waitUntil(
    self.registration.showNotification(payload.title ?? "다먹자 앱", {
      body: payload.body ?? payload.message ?? "새 알림이 도착했어요.",
      data: { url: notificationUrl },
      icon: payload.icon ?? "/icons/icon-192x192.png",
      tag: payload.tag,
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const notificationUrl = getSameOriginUrl(
    (event.notification.data as { url?: unknown } | undefined)?.url,
  );

  event.waitUntil(
    (async () => {
      const windowClients = await self.clients.matchAll({
        includeUncontrolled: true,
        type: "window",
      });
      const matchingClient = windowClients.find(
        (client) => client.url === notificationUrl,
      );

      if (matchingClient) {
        return matchingClient.focus();
      }

      const existingClient = windowClients[0];

      if (existingClient) {
        await existingClient.navigate(notificationUrl);
        return existingClient.focus();
      }

      return self.clients.openWindow(notificationUrl);
    })(),
  );
});

self.addEventListener("fetch", (event) => {
  if (new URL(event.request.url).pathname.startsWith("/api/v1/auth/oauth/")) {
    event.stopImmediatePropagation();
  }
});

disableNavigationPreload();

serwist.addEventListeners();
