"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

import { markAppNavigationIntent } from "@/shared/lib/navigation-history";
import { routes } from "@/shared/routes";

export function useEnterHome() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function enterHome() {
    startTransition(() => {
      markAppNavigationIntent("replace", routes.home);
      router.replace(routes.home);
    });
  }

  return { enterHome, isPending };
}
