/**
 * 뒤로가기 실행 계층이 화면의 업무 조건을 확인하는 지점이다. 작성 중 이탈처럼
 * 이동을 붙잡아야 하는 화면이 가드를 등록한다. 업무 조건은 `NavigationHistoryTracker`나
 * route 정책이 아니라 화면이 판단한다.
 */

/** 이동을 가로챘으면 `true`. 나중에 `proceed()`를 부르면 원래 이동을 그대로 실행한다. */
export type AppBackGuard = (proceed: () => void) => boolean;

// 뒤로가기를 붙잡는 화면은 한 번에 하나다. 나중에 등록한 화면이 앞선 가드를 대신한다.
let activeGuard: AppBackGuard | null = null;

function confirmDocumentLeave(event: BeforeUnloadEvent) {
  if (!activeGuard) return;
  event.preventDefault();
  event.returnValue = "";
}

export function registerAppBackGuard(guard: AppBackGuard) {
  activeGuard = guard;
  window.addEventListener("beforeunload", confirmDocumentLeave);

  return () => {
    if (activeGuard === guard) {
      activeGuard = null;
      window.removeEventListener("beforeunload", confirmDocumentLeave);
    }
  };
}

export function runAppBackGuard(proceed: () => void) {
  const guard = activeGuard;
  return (
    guard?.(() => {
      if (activeGuard === guard) {
        activeGuard = null;
        window.removeEventListener("beforeunload", confirmDocumentLeave);
      }
      proceed();
    }) ?? false
  );
}

const HISTORY_INDEX_KEY = "__dameokjaHistoryIndex";

function readHistoryIndex(state: unknown): number | null {
  const index =
    state && typeof state === "object"
      ? Reflect.get(state, HISTORY_INDEX_KEY)
      : undefined;
  return typeof index === "number" && Number.isSafeInteger(index)
    ? index
    : null;
}

export function installBrowserBackGuard() {
  const { history } = window;
  const originalPush = history.pushState;
  const originalReplace = history.replaceState;
  let currentIndex = readHistoryIndex(history.state) ?? 0;
  let restoringDelta: number | null = null;
  let allowedIndex: number | null = null;

  history.pushState = (data, unused, url) => {
    originalPush.call(
      history,
      { ...data, [HISTORY_INDEX_KEY]: currentIndex + 1 },
      unused,
      url,
    );
    currentIndex += 1;
  };
  history.replaceState = (data, unused, url) => {
    originalReplace.call(
      history,
      { ...data, [HISTORY_INDEX_KEY]: currentIndex },
      unused,
      url,
    );
  };
  history.replaceState(history.state, "");

  function onPopState(event: PopStateEvent) {
    const targetIndex = readHistoryIndex(event.state);
    if (targetIndex === null) return;
    if (targetIndex === allowedIndex) {
      allowedIndex = null;
      currentIndex = targetIndex;
      return;
    }

    if (restoringDelta !== null) {
      event.stopImmediatePropagation();
      if (targetIndex !== currentIndex) {
        history.go(currentIndex - targetIndex);
        return;
      }
      const delta = restoringDelta;
      restoringDelta = null;
      const proceed = () => {
        allowedIndex = currentIndex + delta;
        history.go(delta);
      };
      if (!runAppBackGuard(proceed)) proceed();
      return;
    }

    const delta = targetIndex - currentIndex;
    if (!activeGuard || delta === 0) {
      currentIndex = targetIndex;
      return;
    }

    // popstate는 취소할 수 없으므로 Next.js가 폼을 내리기 전에 원래 항목으로 복귀한다.
    event.stopImmediatePropagation();
    restoringDelta = delta;
    history.go(-delta);
  }

  window.addEventListener("popstate", onPopState, true);
  return () => {
    window.removeEventListener("popstate", onPopState, true);
    history.pushState = originalPush;
    history.replaceState = originalReplace;
  };
}
