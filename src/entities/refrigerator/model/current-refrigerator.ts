import { useSyncExternalStore } from "react";

const STORAGE_KEY = "dameokja.currentRefrigeratorId";
const CHANGE_EVENT = "dameokja:current-refrigerator-change";

function readCurrentRefrigeratorId(): string | null {
  return window.localStorage.getItem(STORAGE_KEY);
}

function subscribe(onChange: () => void): () => void {
  const onStorage = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY) onChange();
  };

  window.addEventListener("storage", onStorage);
  window.addEventListener(CHANGE_EVENT, onChange);

  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener(CHANGE_EVENT, onChange);
  };
}

export function useCurrentRefrigeratorId(): string | null | undefined {
  return useSyncExternalStore(
    subscribe,
    readCurrentRefrigeratorId,
    () => undefined,
  );
}

export function setCurrentRefrigeratorId(refrigeratorId: string | null): void {
  if (refrigeratorId) {
    window.localStorage.setItem(STORAGE_KEY, refrigeratorId);
  } else {
    window.localStorage.removeItem(STORAGE_KEY);
  }

  window.dispatchEvent(new Event(CHANGE_EVENT));
}
