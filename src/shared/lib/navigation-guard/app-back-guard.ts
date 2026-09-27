/**
 * 뒤로가기 실행 계층이 화면의 업무 조건을 확인하는 지점이다. 작성 중 이탈처럼
 * 이동을 붙잡아야 하는 화면이 가드를 등록한다. 업무 조건은 `NavigationHistoryTracker`나
 * route 정책이 아니라 화면이 판단한다.
 */

/** 이동을 가로챘으면 `true`. 나중에 `proceed()`를 부르면 원래 이동을 그대로 실행한다. */
export type AppBackGuard = (proceed: () => void) => boolean;

// 뒤로가기를 붙잡는 화면은 한 번에 하나다. 나중에 등록한 화면이 앞선 가드를 대신한다.
let activeGuard: AppBackGuard | null = null;

export function registerAppBackGuard(guard: AppBackGuard) {
  activeGuard = guard;

  return () => {
    if (activeGuard === guard) {
      activeGuard = null;
    }
  };
}

export function runAppBackGuard(proceed: () => void) {
  return activeGuard?.(proceed) ?? false;
}
