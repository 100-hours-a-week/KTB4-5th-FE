import { routes } from "@/shared/routes";
import { AppLink } from "@/shared/ui/app-link";
import {
  AsyncViewState,
  asyncViewActionClassName,
} from "@/shared/ui/async-view-state";

export function NotFoundPage() {
  return (
    <main className="flex min-h-0 min-w-0 flex-1 flex-col items-center justify-center">
      <AsyncViewState
        status="empty"
        title="페이지를 찾을 수 없어요"
        description="주소가 잘못되었거나 더 이상 없는 페이지예요"
        action={
          <AppLink
            href={routes.home}
            replace
            className={asyncViewActionClassName}
          >
            홈으로 가기
          </AppLink>
        }
      />
    </main>
  );
}
