"use client";

import { useEffect, useState } from "react";

import { getTodayInSeoul } from "@/shared/lib/seoul-date";

export function useIngredientDateStale(baseDate?: string, outdated = false) {
  const [today, setToday] = useState(getTodayInSeoul);

  useEffect(() => {
    const refreshToday = () => setToday(getTodayInSeoul());
    const nextMidnight = Date.parse(`${today}T00:00:00+09:00`) + 86_400_000;
    const timer = window.setTimeout(
      refreshToday,
      Math.max(0, nextMidnight - Date.now()),
    );

    document.addEventListener("visibilitychange", refreshToday);
    window.addEventListener("focus", refreshToday);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener("visibilitychange", refreshToday);
      window.removeEventListener("focus", refreshToday);
    };
  }, [today]);

  return Boolean(baseDate && (baseDate !== today || outdated));
}
