"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";

import {
  consumeAppNavigationIntent,
  readAppNavigationDepth,
  writeAppNavigationDepth,
} from "@/shared/lib/navigation-history";

export function NavigationHistoryTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const search = searchParams.toString();
  const currentUrl = search.length > 0 ? `${pathname}?${search}` : pathname;
  const previousUrlRef = useRef<string | null>(null);
  const currentDepthRef = useRef(0);
  const isPopStateRef = useRef(false);

  useEffect(() => {
    function markPopStateNavigation() {
      isPopStateRef.current = true;
    }

    window.addEventListener("popstate", markPopStateNavigation);

    return () => {
      window.removeEventListener("popstate", markPopStateNavigation);
    };
  }, []);

  useEffect(() => {
    const storedDepth = readAppNavigationDepth();
    const navigationIntent = consumeAppNavigationIntent(currentUrl);

    if (previousUrlRef.current === null) {
      currentDepthRef.current = storedDepth ?? 0;

      if (storedDepth === null) {
        writeAppNavigationDepth(0);
      }
    } else if (previousUrlRef.current !== currentUrl) {
      if (isPopStateRef.current) {
        currentDepthRef.current = storedDepth ?? 0;
        writeAppNavigationDepth(currentDepthRef.current);
      } else if (navigationIntent === "push") {
        currentDepthRef.current += 1;
        writeAppNavigationDepth(currentDepthRef.current);
      } else if (navigationIntent === "replace") {
        writeAppNavigationDepth(currentDepthRef.current);
      } else {
        currentDepthRef.current = 0;
        writeAppNavigationDepth(0);
      }
    }

    previousUrlRef.current = currentUrl;
    isPopStateRef.current = false;
  }, [currentUrl]);

  return null;
}
