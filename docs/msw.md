# MSW API 모킹

MSW는 브라우저의 API 요청을 가로챈다. `src/_app/mocks/handlers.ts`에 등록한 HTTP 메서드와 URL이 일치하면 Mock 응답을 반환하고, 등록하지 않은 요청은 실제 백엔드로 전달한다. 백엔드 API의 구현 여부를 자동으로 감지하지 않는다.

## 실행 환경

| 환경                    | MSW 동작                                                                                                                       |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| 로컬 `pnpm dev`         | 꺼짐. `.env.local`에 `NEXT_PUBLIC_MSW=true`가 있으면 켜짐                                                                      |
| 로컬 `pnpm dev:msw`     | 켜짐. `?msw=off`로 접속하면 해당 브라우저에서 끄고 Serwist를 등록                                                              |
| 로컬 `pnpm build:start` | 켜지지 않음. 운영과 같은 Serwist 캐싱으로 동작하고, `/api/v1`은 `BACKEND_ORIGIN`(기본 `http://localhost:8080`)으로 전달        |
| `dev` 브랜치 배포       | 기본 꺼짐(Serwist 등록). `?msw=on`으로 접속하면 해당 브라우저에서 켜지고 `?msw=off`로 되돌림                                   |
| `main`/production 배포  | 켜지지 않음. `NEXT_PUBLIC_MSW=true`여도 production 환경에서는 시작하지 않고, Docker 이미지에서 `mockServiceWorker.js`도 제외됨 |

MSW와 Serwist는 둘 다 scope `/`의 서비스 워커라 한 브라우저에서 하나만 등록된다. `?msw=on|off` 선택은 브라우저에 저장된다.

`NEXT_PUBLIC_MSW`는 GitHub 변수로 등록할 필요가 없다. 배포 워크플로가 브랜치에 따라 빌드 값을 지정한다. 환경변수는 빌드 또는 개발 서버 시작 시 적용되므로 로컬에서 값을 바꾸면 개발 서버를 다시 시작한다.

## 사용 흐름

1. `src/_app/mocks/handlers.ts`에 실험할 API의 HTTP 메서드와 URL에 맞는 핸들러를 추가한다.
2. 화면에서 해당 URL을 호출하면, MSW가 켜진 환경에서는 Mock 응답이 실제 백엔드보다 우선한다. 브라우저에서 호출하지 않는 서버 측 요청은 이 워커가 가로채지 않는다.
3. 실제 백엔드 연동을 마치면 해당 핸들러를 삭제한다. 같은 URL의 요청이 다시 실제 백엔드로 전달된다. MSW 패키지는 유지해도 된다.

현재 예제는 `GET /api/v1/mock/health`다. MSW가 켜진 앱의 브라우저 콘솔에서 아래 명령을 실행하면 정상 동작 시 `MOCK-200-001` 응답이 나온다.

```js
fetch("/api/v1/mock/health")
  .then((response) => response.json())
  .then(console.log);
```

Chrome 개발자 도구의 **애플리케이션 → Service workers → 네트워크 우회**는 꺼둔다. 켜면 요청이 MSW를 건너뛴다. `GLOBAL-500-001`처럼 실제 백엔드 응답이 나오면 Mock 핸들러가 응답한 것이 아니다.

## 추천 API와 화면 확인

`src/_app/mocks/recommendation`에서 다음 API를 모의한다. 화면은 공통 API
client와 TanStack Query로 실제 요청을 보내고, MSW가 켜졌을 때만 응답을 대신한다.

| API                                                  | 기본 동작                                                         |
| ---------------------------------------------------- | ----------------------------------------------------------------- |
| `GET /api/v1/refrigerators/:id/recommendations`      | 조회만 수행, 서버 순서의 추천 10건 반환                           |
| `POST /api/v1/refrigerators/:id/recommendation-jobs` | 최신이면 200, 생성·동일 작업이면 202, 한도 소진이면 429           |
| `GET /api/v1/refrigerators/:id/recipes/:recipeId`    | 레시피와 현재 모의 재고 반환                                      |
| `POST /api/v1/refrigerators/:id/cooking-records`     | CSRF·멱등 키 검증, 차감 후 200, 동일 요청 재시도 204, 키 충돌 409 |

추천 목록은 `/recommendations`, 상세는
`/recommendations/51?recommendationId=rec_001`에서 확인한다. 목록에서 상세로
이동하면 추천 ID를 자동 전달한다. ID 없이 상세에 진입하면 목록 조회로 해당
레시피가 포함된 추천 ID를 확인한다.

테스트 전용 브라우저에서 `http://localhost:3000/login?msw=on`을 열고 다음
쿠키를 설정한 뒤 추천 화면으로 이동한다. 아래 accessToken은 실제 인증 정보가
아닌 MSW 전용 값이다.

```js
document.cookie = "accessToken=local-msw-only; Path=/; SameSite=Lax";
document.cookie = "currentRefrigeratorId=1; Path=/; SameSite=Lax";
document.cookie = "recommendationMock=STALE; Path=/; SameSite=Lax";
location.href = "/recommendations?msw=on";
```

| 쿠키                 | 값과 확인할 상태                                                                                                         |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `recommendationMock` | `READY`, `STALE`, `GENERATING`, `EMPTY`, `LIMIT_REACHED`                                                                 |
| `recommendationMock` | `GENERATING_EMPTY` 최초 생성 중, `LIMIT_EMPTY` 이력 없는 한도 소진, `NO_RESULTS` 결과 없음, `NO_STOCKS` 차감할 재고 없음 |
| `recommendationMock` | `400`, `401`, `403`, `404`, `500` 목록 실패                                                                              |
| `jobMock`            | `400`, `401`, `403`, `404`, `429`, `500` 생성 요청 실패                                                                  |
| `detailMock`         | `400`, `401`, `403`, `404`, `500` 상세 실패                                                                              |
| `cookingMock`        | `400`, `401`, `403`, `404`, `409`, `500` 적용 실패, `LOST_RESPONSE` 서버 처리 후 응답 유실                               |

쿠키를 변경한 뒤 새로고침한다. 실패 쿠키는 `document.cookie =
"cookingMock=; Path=/; Max-Age=0"`처럼 지운다. `recommendationMock` 쿠키가
있을 때만 화면 진입에 필요한 냉장고·재고·알림·분석 배너·CSRF도 함께 모의한다.
API 오류는 서비스 코드가 포함된 RFC 9457 Problem Details로 응답한다.
목록의 `403`은 공통 접근 권한 복구 정책에 따라 2번 냉장고를 선택하고 홈으로
이동한다. 이 경우 단독 오류 화면 대신 복구된 홈을 확인한다.

홈과 추천 진입 시 GET 결과가 `STALE` 또는 `EMPTY`일 때만 생성 요청을 보낸다.
현재 목록은 유지하며 생성 직후 재조회·폴링하지 않는다. 생성 결과는 다음
화면 진입의 GET에서 반영한다. `GENERATING`·`LIMIT_REACHED`에서 중복 생성하지
않는다. 요리 적용 직후에는 재고·상세·MY 캐시만 갱신하며 추천 생성은 하지 않는다.
응답을 받지 못한 적용 재시도는 열린 상세 화면에서 같은 멱등 키를 유지한다.

모의 데이터는 페이지 런타임 메모리에 저장되므로 새로고침하면 초기화된다.
작업 상태 조회 API가 명세에 없어 작업 완료는 다음 목록 GET에서 모의한다.
실제 AI 호출·공유 냉장고 동시성·서버 멱등 보존 기간을 검증하는 모의 구현은 아니다.
차감 순서와 전량 소진 처리는 미확정이므로 모의 구현은 비만료 재고를 만료일순으로
차감하고 0 수량 재고를 제거한다. `EXCLUDE_EXPIRED` 요청은 핸들러에서 지원하지만
수동 생성·모드 변경 버튼은 추가하지 않았다. 향후 모드 변경 UI를 추가할 때는
명세대로 확인 모달을 먼저 거쳐야 한다.
