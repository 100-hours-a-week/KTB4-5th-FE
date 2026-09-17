"use client";

import { Toaster } from "sonner";

export function AppToastProvider() {
  return (
    <Toaster
      position="bottom-center"
      duration={3000}
      visibleToasts={1}
      expand={false}
      closeButton={false}
      offset={{
        bottom: "var(--toast-bottom-offset, calc(20px + var(--safe-bottom)))",
      }}
      mobileOffset={{
        bottom: "var(--toast-bottom-offset, calc(20px + var(--safe-bottom)))",
      }}
      containerAriaLabel="알림"
      toastOptions={{ unstyled: true, style: { width: "100%" } }}
      style={{
        width: "min(calc(100vw - 32px), var(--app-max-width))",
        left: "50%",
        right: "auto",
        transform: "translateX(-50%)",
      }}
    />
  );
}
