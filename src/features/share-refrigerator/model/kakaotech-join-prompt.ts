"use client";

import { useSyncExternalStore } from "react";

const CHANGE_EVENT = "dameokja:kakaotech-join-prompt";
const storageKey = (refrigeratorId: string) =>
  `dameokja.kakaotechJoinPrompt.${refrigeratorId}`;

function subscribe(onChange: () => void) {
  window.addEventListener(CHANGE_EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(CHANGE_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

export function dismissKakaotechJoinPrompt(refrigeratorId: string) {
  try {
    window.localStorage.setItem(storageKey(refrigeratorId), "dismissed");
  } catch {
    return;
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

export function useKakaotechJoinPrompt(refrigeratorId: string) {
  return useSyncExternalStore(
    subscribe,
    () => {
      try {
        return (
          window.localStorage.getItem(storageKey(refrigeratorId)) !==
          "dismissed"
        );
      } catch {
        return false;
      }
    },
    () => false,
  );
}
