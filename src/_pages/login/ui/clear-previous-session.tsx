"use client";

import { useEffect } from "react";

import { clearTodayTaste } from "@/features/answer-taste-survey";

export function ClearPreviousSession() {
  useEffect(() => {
    clearTodayTaste();
  }, []);

  return null;
}
