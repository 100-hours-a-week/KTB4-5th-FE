"use client";

import {
  AsyncViewState,
  asyncViewActionClassName,
} from "@/shared/ui/async-view-state";

/**
 * 네트워크가 끊긴 상태에서 문서를 요청하면 Service Worker가 대신 보여주는 화면.
 * Service Worker가 설치될 때 미리 캐시되므로 서버 데이터에 의존하지 않는다.
 */
export function OfflinePage() {
  return (
    <main className="flex min-h-0 min-w-0 flex-1 flex-col items-center justify-center">
      <AsyncViewState
        status="error"
        title="인터넷에 연결되어 있지 않아요"
        description="연결 상태를 확인한 뒤 다시 시도해 주세요"
        action={
          <button
            type="button"
            onClick={() => window.location.reload()}
            className={asyncViewActionClassName}
          >
            다시 시도
          </button>
        }
      />
    </main>
  );
}
