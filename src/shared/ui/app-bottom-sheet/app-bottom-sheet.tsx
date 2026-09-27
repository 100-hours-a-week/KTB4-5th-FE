"use client";

import { Drawer } from "@base-ui/react/drawer";
import { useRef, type ReactNode } from "react";

export type AppBottomSheetDismissBehavior = "dismiss" | "none";

export type AppBottomSheetProps = {
  open: boolean;
  onDismiss: () => void;
  dismissBehavior?: AppBottomSheetDismissBehavior;
  children: ReactNode;
};

type AppBottomSheetTextProps = {
  className?: string;
  children: ReactNode;
};

export function AppBottomSheet({
  open,
  onDismiss,
  dismissBehavior = "dismiss",
  children,
}: AppBottomSheetProps) {
  const popupRef = useRef<HTMLDivElement>(null);
  const canDismiss = dismissBehavior === "dismiss";

  // 되돌릴 수 없는 확인 시트가 많으므로 [보조][주] 순서의 첫 버튼에 focus를 둔다.
  function getInitialFocus() {
    return (
      popupRef.current?.querySelector<HTMLElement>("button:not(:disabled)") ??
      true
    );
  }

  // 바깥 탭·ESC·아래로 스와이프는 모두 onDismiss 하나로 모은다.
  // 닫을 수 없는 동안에는 Base UI의 닫힘 처리를 취소해 시트를 제자리로 돌린다.
  function handleOpenChange(
    nextOpen: boolean,
    eventDetails: Drawer.Root.ChangeEventDetails,
  ) {
    if (nextOpen) {
      return;
    }

    if (!canDismiss) {
      eventDetails.cancel();
      return;
    }

    onDismiss();
  }

  return (
    <Drawer.Root
      open={open}
      onOpenChange={handleOpenChange}
      disablePointerDismissal={!canDismiss}
    >
      <Drawer.Portal>
        <Drawer.Backdrop className="fixed inset-0 min-h-dvh bg-[color-mix(in_srgb,var(--color-ink)_58%,transparent)] opacity-[calc(1-var(--drawer-swipe-progress))] transition-opacity duration-[450ms] ease-[cubic-bezier(0.32,0.72,0,1)] data-swiping:duration-0 data-starting-style:opacity-0 data-ending-style:opacity-0 data-ending-style:duration-[calc(var(--drawer-swipe-strength)*400ms)]" />
        <Drawer.Viewport className="fixed inset-0 flex items-end justify-center">
          {/* 위로 끌어올릴 때 아래 틈이 보이지 않도록 bleed만큼 화면 밖으로 연장한다. */}
          <Drawer.Popup
            ref={popupRef}
            initialFocus={getInitialFocus}
            className="-mb-12 max-h-[calc(100dvh_-_var(--safe-top)_-_24px_+_3rem)] w-[min(100%,var(--app-max-width))] overflow-y-auto overscroll-contain rounded-t-[16px] bg-white px-5 pt-3 pb-[calc(20px_+_var(--safe-bottom)_+_3rem)] text-app-text shadow-[0_-4px_16px_color-mix(in_srgb,var(--color-ink)_16%,transparent)] outline-none [transform:translateY(var(--drawer-swipe-movement-y))] transition-transform duration-[450ms] ease-[cubic-bezier(0.32,0.72,0,1)] data-swiping:select-none data-starting-style:[transform:translateY(calc(100%_-_3rem_+_2px))] data-ending-style:[transform:translateY(calc(100%_-_3rem_+_2px))] data-ending-style:duration-[calc(var(--drawer-swipe-strength)*400ms)]"
          >
            <span
              aria-hidden="true"
              className="mx-auto mb-4 block h-1 w-10 rounded-full bg-[color-mix(in_srgb,var(--color-ink)_18%,transparent)]"
            />
            <Drawer.Content>{children}</Drawer.Content>
          </Drawer.Popup>
        </Drawer.Viewport>
      </Drawer.Portal>
    </Drawer.Root>
  );
}

// 시트의 접근 가능한 이름과 설명으로 연결된다. 스타일은 사용처가 정한다.
export function AppBottomSheetTitle({
  className,
  children,
}: AppBottomSheetTextProps) {
  return <Drawer.Title className={className}>{children}</Drawer.Title>;
}

export function AppBottomSheetDescription({
  className,
  children,
}: AppBottomSheetTextProps) {
  return (
    <Drawer.Description className={className}>{children}</Drawer.Description>
  );
}
