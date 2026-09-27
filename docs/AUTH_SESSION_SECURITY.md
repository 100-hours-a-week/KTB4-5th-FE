# 로그인·세션·CSRF 처리 규칙

이 문서는 로그인 직후 알림 온보딩을 포함한 인증 흐름에서 사용자 자격 증명과
세션을 안전하게 다루기 위한 기준이다. 화면 URL 구성과 로그인 정보를 다루는
방식은 별개의 문제로 판단한다.

**규칙에 없는 부분은 추측해서 채우지 않는다.** §10 "불일치·미확정 항목"에 없는
새로운 모호함을 발견하면 임의로 채우지 말고 이 문서에 추가한 뒤 질문한다.

## 0. 전제

- FE: Next.js App Router + SSR + TanStack Query + TypeScript, 모바일 웹 전용,
  전 페이지 인증 필요(인증·온보딩 화면 자체를 제외하면 공개 페이지 없음)
- BE: Spring(Spring Security), API prefix `/api/v1`
- 인증: JWT를 `HttpOnly` 쿠키로 운반. FE JS는 `accessToken`/`refreshToken`을
  읽을 수도, 읽을 필요도 없다. `localStorage`/`sessionStorage`/메모리(React
  state, Zustand)에 토큰을 저장하지 않는다.
- CSRF: **Double-Submit Cookie 패턴** (Spring `CookieCsrfTokenRepository` 방식)
  - 서버가 `XSRF-TOKEN` 쿠키 발급 (`HttpOnly` 아님 → JS가 읽을 수 있음)
  - FE는 상태 변경 요청(`POST`/`PUT`/`PATCH`/`DELETE`)마다 쿠키 값을 읽어
    `X-XSRF-TOKEN` 헤더에 복사
  - 서버는 쿠키 값 == 헤더 값인지 검증. 실패 시 `403 / COMMON-403-CSRF-001`

## 1. 기본 원칙

화면 사이에 로그인 정보를 전달하는 흐름 자체를 만들지 않는다.

```text
로그인 폼 → 서버 인증 요청(POST /api/v1/auth/sessions) → 세션 쿠키 발급 → 알림 안내 화면 → 홈
```

사용자가 아이디·비밀번호를 제출하면 HTTPS 요청으로 인증 서버에 보낸다. 서버가
인증을 판단하고 성공하면 새 세션을 만든다. 이후 화면에는 비밀번호가 아니라
해당 브라우저의 인증된 세션만 필요하다.

세션 식별자는 예측할 수 없는 값이어야 하며, 값 자체에 아이디·비밀번호·개인정보를
넣지 않는다. 사용자 식별, 권한, 만료 시각, 온보딩 완료 여부 같은 의미와 정책은
서버 세션 또는 검증 가능한 서버 측 토큰에서 관리한다. 로그인처럼 권한 수준이
변하는 시점에는 기존 세션을 재사용하지 않고 새 세션 식별자를 발급한다.

## 2. 세션 쿠키

인증에 성공하면 서버는 응답의 `Set-Cookie` 헤더로 세션을 설정한다. 세션 쿠키는
적어도 다음 속성을 명시한다.

| 속성                         | 목적                                                                                                       |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `HttpOnly`                   | 브라우저 JavaScript가 세션 값을 읽지 못하게 한다.                                                          |
| `Secure`                     | HTTPS 연결에서만 쿠키를 전송한다. 개발 환경의 HTTP 예외는 운영 설정과 분리한다.                            |
| `SameSite=Lax` 또는 `Strict` | 다른 사이트에서 시작된 요청에 쿠키를 보낼 범위를 제한한다. 외부 OAuth 복귀 흐름 등은 계약에 맞춰 선택한다. |
| `Path=/`                     | 필요한 애플리케이션 경로에서만 쿠키를 보낸다.                                                              |
| `Max-Age` 또는 `Expires`     | 세션의 유효 기간을 명시한다.                                                                               |

현재 API 계약(§8.1) 기준 값:

- `accessToken`: `Max-Age=900`(15분), `HttpOnly; Secure; SameSite=Lax; Path=/`
- `refreshToken`: `Max-Age=172800`(2일), `HttpOnly; Secure; SameSite=Lax; Path=/`
  — **`Path=/`는 모든 요청에 refresh가 실려 노출면이 넓어진다.**
  `Path=/api/v1/auth` 등으로 좁히는 걸 백엔드와 검토한다 (§10).
- `XSRF-TOKEN`: `HttpOnly` 아님, `Path=/; Secure; SameSite=Lax`, **`Max-Age`
  없는 세션 쿠키** → 브라우저 재시작 후 사라질 수 있다는 전제로 코드를 짠다.

`accessToken`·`refreshToken`은 실제로 **JWT**이고, 유효기간은 각각 15분·2일이며
**브라우저의 `HttpOnly` 쿠키에만 저장**된다. 위 Max-Age·속성 값과 일치한다 — 이
문서의 다른 값들이 §10처럼 아직 API 시트 기준(미검증)인 것과 달리, 이 세 가지는
백엔드가 실제로 그렇게 구현했다고 확인된 값이다.

브라우저는 이후 같은 대상 서버에 요청할 때 세션 쿠키를 자동으로 전송한다. 따라서
React state, Zustand, URL에 토큰을 복사하거나 다음 화면으로 비밀번호를 다시
전달할 필요가 없다.

Next.js에서 쿠키 읽기는 Server Component에서 가능하지만, 쿠키 생성·갱신·삭제는
응답 헤더가 필요한 Server Action 또는 Route Handler에서 수행한다. 다만 이
프로젝트는 §6에서 정한 대로 Next.js가 세션을 발급·검증하지 않으므로, Next.js가
직접 이 쿠키들을 생성·갱신·삭제하는 일은 없다 — 전부 백엔드 응답의
`Set-Cookie`가 브라우저까지 그대로 전달될 뿐이다. 세션 서명 키, 세션 검증,
백엔드용 비밀 값은 애초에 FE가 가지지 않는다.

## 3. 알림 온보딩 진입과 완료

알림 온보딩은 독립 URL로 구성해도 되고, 로그인 URL 내부의 단계 전환으로
구성해도 된다. 어느 방식이든 보안의 핵심은 URL이 아니라 서버가 인증과 온보딩
상태를 확인하는 데 있다.

- 인증되지 않은 사용자가 알림 온보딩이나 보호 화면에 직접 접근하면 로그인으로
  보낸다.
- 기존 회원 또는 이미 온보딩을 마친 사용자는 홈으로 보낸다.
- 신규 회원이 온보딩을 완료하면 서버에 완료 상태를 저장한 뒤 홈으로 이동한다.
- 새로고침·직접 URL 입력·다른 탭 진입에도 동일한 서버 상태 판정을 적용한다.
- 보호 자원과 상태 변경 API는 화면 진입을 막는 것만으로 끝내지 않고, 각 요청에서
  세션과 권한을 다시 검증한다.

## 4. 브라우저 저장소에 두지 않을 값

아래 값은 URL, query string, hash, `localStorage`, `sessionStorage`, IndexedDB,
Zustand, React state에 보관하거나 다음 단계로 전달하지 않는다.

- 비밀번호와 OAuth authorization code
- 세션 ID, 액세스 토큰, 리프레시 토큰
- 인증·인가 판단에 사용하는 비밀 값

특히 `localStorage`와 `sessionStorage`는 같은 출처의 JavaScript가 읽을 수 있다.
XSS 취약점이 하나라도 있으면 저장된 민감 값을 탈취하거나 변경할 수 있으므로,
인증 정보를 보호하는 저장소로 사용하지 않는다. React state나 Zustand는 영속성은
낮더라도 클라이언트 JavaScript에서 접근 가능하므로 비밀 저장소가 아니다.

아이디처럼 민감도가 낮은 화면 표시용 값도 다음 단계에 꼭 필요하지 않으면 넘기지
않는다. 표시가 필요하면 세션을 검증한 서버가 최소한의 사용자 정보를 제공한다.

`XSRF-TOKEN`은 이 규칙의 예외다 — Double-Submit Cookie 패턴이 성립하려면 FE
JS가 이 쿠키만은 반드시 읽어야 한다. 대신 `XSRF-TOKEN` 자체는 세션을 증명하는
값이 아니라 "같은 사이트의 JS가 요청했다"는 증거일 뿐이므로 별도 저장소에
복사하지 않고 매 요청마다 쿠키에서 다시 읽는다.

## 5. CSRF와 XSS는 별도로 방어한다

`HttpOnly`는 JavaScript가 세션 값을 읽지 못하게 할 뿐, XSS가 사용자를 대신해
같은 사이트 요청을 보내는 문제까지 막지는 못한다. `SameSite`도 CSRF 완화 수단이지
CSRF 방어 전체를 대체하지 않는다.

### 5.1 왜 Double-Submit Cookie인가 (판단 근거)

쿠키 인증은 브라우저가 쿠키를 자동 첨부하므로, 공격자 사이트가 사용자 브라우저로
우리 API에 요청을 보내게 만들 수 있다 — 이것이 CSRF다.

공격자는 요청을 "보내게" 할 수는 있어도 우리 도메인의 쿠키를 읽을 수 없고
(Same-Origin Policy), 커스텀 헤더를 붙인 cross-origin 요청은 CORS preflight에서
막힌다. 그래서 **"쿠키 값을 읽어서 헤더로 다시 보낸다"는 행위 자체가 같은
사이트의 JS라는 증명**이 된다.

`SameSite=Lax`만으로 부족한 이유:

1. `Lax`는 top-level GET 이동에는 쿠키를 보낸다 → GET에 부수 효과가 있으면
   뚫린다. 그래서 **GET 요청은 절대 상태를 변경하지 않는다** — GET은 CSRF
   검증 대상이 아니기 때문이다.
2. `SameSite`는 "사이트"(eTLD+1) 기준이라 같은 사이트의 다른 서브도메인이
   오염되면 막지 못한다. CSRF 토큰은 이에 대한 심층 방어(defense in depth)다.

반대로 **CSRF 토큰은 XSS를 막지 못한다.** XSS가 있으면 공격자 JS가
`XSRF-TOKEN`을 읽어 헤더를 붙일 수 있다. XSS 방어(`dangerouslySetInnerHTML`
금지, 입력 이스케이프, 출력 인코딩, CSP)는 별개 과제이며 이 문서의 범위가
아니다.

### 5.2 상태 변경 요청의 검증

- `POST`, `PUT`, `PATCH`, `DELETE` 같은 상태 변경 요청은 서버에서 인증·인가를
  검증한다.
- 쿠키 기반 인증에서 교차 사이트 요청 가능성이 있는 구조라면 CSRF 토큰(§8.1~8.3)
  또는 서버가 승인한 동등한 방어를 적용한다.
- 세션 만료, 로그아웃, 비밀번호 변경, 권한 변경 때 세션을 폐기하거나 갱신한다.
- 로그인 API에는 백엔드 정책에 따라 실패 횟수 제한과 관찰·감사를 적용한다.

## 6. Next.js와 분리 백엔드의 경계

Next.js와 백엔드 API가 서로 다른 도메인이라면, 백엔드가 발급한 쿠키를 Next.js
서버가 자동으로 읽을 수 있다고 가정하면 안 된다. 세션 쿠키를 누가 발급하고
검증하는지, 쿠키의 도메인·`SameSite`·CORS·CSRF 정책을 배포 구조와 함께 확정한다.

가능한 구조는 다음 두 가지다.

1. 백엔드가 브라우저 세션 쿠키를 발급하고, API 요청마다 백엔드가 이를 검증한다.
2. Next.js 서버가 인증 경계가 되어 세션 쿠키를 관리하고, 서버가 백엔드와 통신한다.

이 프로젝트는 **1번 구조**를 선택했다. Next.js는 세션을 발급·검증·저장하지
않으며, 인증·인가 판단에 개입하지 않는다.

Double-Submit Cookie는 **FE의 JS가 `XSRF-TOKEN` 쿠키를 읽을 수 있어야** 성립한다.
쿠키는 발급한 도메인에 묶이므로, FE와 BE가 다른 사이트(예: `xxx.vercel.app` ↔
`api.dameokja.com`)면 FE JS는 API 도메인 쿠키를 못 읽고 `SameSite=Lax` 쿠키는
cross-site fetch에 실리지도 않아 **로그인 자체가 동작하지 않는다.** 성립 조건은
다음 중 하나가 필요하다.

1. 같은 등록 도메인 하위 + 쿠키 `Domain=.dameokja.com`
2. Next.js rewrites로 `/api/*`를 백엔드로 프록시해 브라우저 입장에서
   same-origin으로 만든다
3. `/auth/csrf`가 토큰을 응답 body로도 반환한다

**이 프로젝트는 2번(Next.js rewrites Same-Origin 프록시)을 선택했다.**
`next.config.ts`의 `rewrites`로 `/api/v1/**` 요청을 로컬 백엔드
(`http://localhost:8080`, `BACKEND_ORIGIN`으로 재정의 가능)까지 경로만
재작성해 중계한다 — 인증 로직을 포함하지 않는 순수 프록시다. 운영에서
CloudFront/ALB가 같은 역할을 하는 것과 같은 층위이며, 이 프록시가 Next.js를
인증 경계로 만드는 것은 아니다. 세션 발급·검증·`Set-Cookie`는 여전히 백엔드가
응답한 그대로 브라우저까지 중계될 뿐, Next.js가 읽거나 고쳐 쓰지 않는다.
**CORS 설정도 이 구조에서는 필요 없어진다.**

cross-origin으로 가야 하는 상황(예: 로컬 프록시를 쓰지 못하는 환경)이 생기면
백엔드 CORS는 다음을 만족해야 한다.

- `Access-Control-Allow-Credentials: true`
- Origin 와일드카드 금지 — 정확한 Origin을 명시
- `X-XSRF-TOKEN`을 `Access-Control-Allow-Headers`에 포함

**배포 도메인 : `https://dev.dameokja.com/`.** FE·BE가
이 하나의 도메인 아래 CloudFront/ALB Path Routing으로 묶여 있다 — 브라우저는
`dev.dameokja.com`에만 요청을 보내고, `/api/**`만 내부적으로 백엔드로
라우팅된다. 즉 배포 환경은 **진짜 Same-Origin**이라 위 세 조건 중 어느 것도
따로 만족시킬 필요가 없다 (서브도메인을 나눠 `Domain=.dameokja.com` 쿠키를
쓰는 1번 방식도 아니고, 로컬처럼 Next.js가 대신 프록시할 필요도 없다 — CDN이
이미 같은 역할을 한다). **로컬에서만** 포트가 달라 §6 위쪽에서 정한
Next.js rewrites 프록시가 필요하다.

어느 구조든 클라이언트는 비밀번호나 장기 토큰을 보관하지 않는다. API URL은 UI가
직접 작성하지 않고 해당 Entity 또는 Feature의 API 경계에서 소유한다.

## 7. 현재 구현 상태

**`/login` 실제 연동 완료 (2026-09-22).** 한 화면·한 폼(`loginId`,
`password`)이 로그인과 회원가입을 함께 처리한다.

```text
제출
 └─ POST /api/v1/auth/sessions
     ├─ 성공 → 기존 계정: 온보딩 없이 곧장 홈으로 이동(replace)
     └─ 404 AUTH-404-001(계정 없음)일 때만
         └─ POST /api/v1/users (같은 loginId·password로 가입)
             └─ 성공 → 신규 계정: 알림 온보딩 화면 표시 → "시작하기" → 홈
```

- 신규/기존 판정은 프론트가 아이디·비밀번호로 임의 추측하지 않고, 로그인
  API의 `404` 여부라는 서버 신호로만 결정한다.
- 알림 온보딩 화면은 **회원가입 루트로 왔을 때만** 보인다(§3의 "언제
  보이는가"에 해당하는 세부 규칙, 팀 결정 2026-09-22).
- 실패 시(형식 오류, 비밀번호 오류로 추정되는 400/401/404/422, 네트워크
  오류 포함) `password` 필드 아래에 SERVICE_COMMON_RULES §5.1 표준 문구만
  표시한다. 계정 존재 여부는 문구로 노출하지 않는다.
- 구현 위치: `src/features/login`(스키마·API·`useLoginOrSignup` mutation),
  `src/_pages/login`(RHF 연결, 화면 분기).

프론트 공통 API 클라이언트에는 §8.2~8.4의 CSRF 헤더 첨부·토큰 수명 관리·401
갱신(single-flight)이 코드로 반영돼 있다 (2026-09-22).

- `shared/lib/cookie`: `document.cookie`에서 이름으로 값을 읽는 범용 유틸
- `shared/api/csrf.ts`: `XSRF-TOKEN` 읽기, 없으면 `GET /auth/csrf`로 발급,
  강제 재발급(`refreshCsrfToken`)
- `shared/api/token-refresh.ts`: `POST /auth/token-renewals` 단일 비행(single-flight)
- `shared/api/fetch-client.ts`: 상태 변경 요청에 `X-XSRF-TOKEN` 자동 첨부,
  `403 COMMON-403-CSRF-001` 1회 재시도, `401` 갱신 후 1회 재시도(인증 API
  자체는 제외해 무한루프 방지), 최종 실패 시 `SessionExpiredError`
- `_app/providers/query-provider`: `SessionExpiredError`를 전역
  `QueryCache`/`MutationCache` `onError`에서 잡아 `queryClient.clear()` →
  `routes.login`으로 이동
- `_app/providers/csrf-bootstrap-provider`: 앱 진입 시 1회 `GET /auth/csrf`

**아직 반영되지 않은 것** — 로그인·회원가입 성공 직후 CSRF 재발급은
`useLoginOrSignup`의 `onSuccess`에 붙였다(§8.3). 로그아웃 UI·API는 아직
연동 안 해서 그쪽 재발급은 로그아웃을 구현할 때 같이 붙인다.

SSR 측(§8.5)은 (b)로 결정만 했고 코드는 아직 없다. 서버에서 인증 데이터를
가져오는 화면이 없어서다 — 홈 헤더 "{loginId}네 냉장고"용 목업 `getUserSession()`은
지웠고(헤더는 기본 "홈"), 다시 붙이려면 "내 세션 조회" API가 §8.1 계약에 없어서
먼저 백엔드와 확정해야 한다. 그 화면을 만들 때 서버용 fetch 헬퍼도 같이 만든다.

**지금 범위 밖(팀 결정, 2026-09-22):** §8.6 OAuth, §8.7 S3 presigned URL은
현재 고려하지 않는다. 계약(§8.1)은 기록해두지만 구현·검토 대상에서 뺀다 — 해당
기능이 실제로 착수될 때 이 문서를 다시 보고 §12에 작업으로 되돌린다.

## 8. 인증·CSRF API 계약과 FE 구현 규칙

### 8.1 API 계약 (API 시트 기준 + 실측 확인)

| 기능                                                 | 요청                                                  | CSRF 헤더                 | 성공 응답                                                                                                                                                                                                                                                                                                                                  |
| ---------------------------------------------------- | ----------------------------------------------------- | ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| CSRF 토큰 발급                                       | `GET /api/v1/auth/csrf`                               | 불필요                    | `204`, `Set-Cookie: XSRF-TOKEN; Path=/; Secure; SameSite=Lax` (유효 토큰 있으면 재사용) — **실측 확인**                                                                                                                                                                                                                                    |
| 회원가입 (API 시트에 없던 엔드포인트, 실측으로 추가) | `POST /api/v1/users` `{loginId, password, nickname?}` | 필수                      | `201`, `{"code":"USER-201-001","message":"회원가입 성공","data":{"activeRefrigeratorIds":[...]}}` + **가입과 동시에 로그인** — access/refresh 쿠키도 함께 발급됨 — **실측 확인**                                                                                                                                                           |
| 로그인                                               | `POST /api/v1/auth/sessions` `{loginId, password}`    | 필수                      | `200`, `{"code":"AUTH-200-001","message":"로그인 성공","data":{"activeRefrigeratorIds":[...]}}` + `accessToken`(Max-Age=900) + `refreshToken`(Max-Age=172800) 쿠키, 둘 다 `HttpOnly; Secure; SameSite=Lax; Path=/`. **`XSRF-TOKEN`도 새 값으로 재발급됨(로그인 시 CSRF 교체 확인)** — **실측 확인**                                        |
| 토큰 갱신                                            | `POST /api/v1/auth/token-renewals`                    | 필수                      | `200`, `{"code":"AUTH-200-003","message":"인증정보 갱신 성공","data":{"userId":"..."}}` + access/refresh 쿠키 재발급. **실패 시**: 이미 쓴(rotation된) refreshToken 재사용 → `401 AUTH-401-002` "리프레시 토큰이 유효하지 않습니다"; refreshToken 자체가 없음 → `401 AUTH-401-003` "리프레시 토큰이 필요합니다" — **rotation 실동작 확인** |
| 로그아웃                                             | `DELETE /api/v1/auth/sessions`                        | 필수                      | `200`, `{"code":"AUTH-200-002","message":"로그아웃 성공","data":null}` + access/refresh 쿠키 모두 `Max-Age=0`으로 삭제됨(§10 우려와 달리 정상 처리) — **실측 확인**                                                                                                                                                                        |
| OAuth 시작                                           | `GET /api/v1/auth/oauth/{kakao\|google}`              | 불필요                    | `302` → 제공자. 서버가 일회용 state 생성·브라우저에 바인딩                                                                                                                                                                                                                                                                                 |
| OAuth 콜백                                           | `GET /api/v1/auth/oauth/code/{provider}?code&state`   | 불필요(state로 CSRF 방어) | 기존회원: `302 → {FRONT}/` + 인증 쿠키 / 신규: `302 → {FRONT}/signup` + `registrationToken`(Max-Age=600) / 거부: `/login?error=OAUTH_CANCELLED` / 실패: `/login?error=OAUTH_LOGIN_FAILED`                                                                                                                                                  |
| 그 외 모든 인증 API                                  | `accessToken` 쿠키                                    | 상태 변경 시 필수         | —                                                                                                                                                                                                                                                                                                                                          |

입력 검증: `loginId` 2~10자 영문·숫자(공백 제거), `password` 8자 이상 +
영문·숫자 각 1자 이상. FE에서도 동일 규칙으로 선검증하되 **서버 검증을
대체하지 않는다.**

**실측 메모 (2026-09-22, 로컬 백엔드 대상 curl):** 로그아웃 응답에서
`XSRF-TOKEN` `Set-Cookie`가 한 응답에 3번(만료 1번 + 재발급 2번) 찍히는 걸
봤다. 최종적으로 브라우저는 마지막 값만 쓰므로 동작엔 문제없지만, 의도한
동작인지는 확인 안 함.

### 8.2 FE 구현 규칙 — API 클라이언트 (단일 fetch 래퍼)

- 모든 요청 `credentials: 'include'`.
- 메서드가 `POST`/`PUT`/`PATCH`/`DELETE`면 `document.cookie`에서
  `XSRF-TOKEN`을 읽어 `X-XSRF-TOKEN` 헤더에 넣는다. 값은
  `decodeURIComponent` 처리한다.
- 쿠키가 없으면 먼저 `GET /api/v1/auth/csrf`를 호출한 뒤 진행한다.
- 컴포넌트에서 `fetch`를 직접 호출하지 않는다. 반드시 이 래퍼를 경유한다.
- 로컬 개발은 §6에서 정한 Next.js Dev Server `rewrites`(`next.config.ts`)를
  전제로 한다 — 프록시는 경로만 재작성하는 순수 중계이며 인증 로직을 갖지
  않는다.

### 8.3 FE 구현 규칙 — CSRF 토큰 수명 관리

- 앱 부트스트랩 시 1회 `GET /api/v1/auth/csrf`.
- 인증 상태가 바뀐 직후 반드시 재발급: 로그인 성공, OAuth 콜백 후 첫 진입,
  로그아웃 후. (Spring Security 6은 인증 시점에 CSRF 토큰을 교체하므로 로그인
  전 토큰은 무효가 될 수 있다.)
- `403`이면서 `code`가 `COMMON-403-CSRF-001`인 경우만: 토큰 재발급 → 원 요청
  **1회만** 재시도한다. 재시도도 실패하면 에러로 올린다. 권한 부족 `403`과는
  `status`가 아니라 `code`로 구분한다.
- `XSRF-TOKEN`은 `Max-Age` 없는 세션 쿠키다 → 브라우저 재시작 후 사라질 수
  있다는 전제로 코드를 짠다.

### 8.4 FE 구현 규칙 — Access 만료 처리 (401)

- `accessToken` 15분, `refreshToken` 2일.
- `401` 수신 → `POST /api/v1/auth/token-renewals`(CSRF 헤더 포함) → 성공 시
  원 요청 재시도.
- **single-flight 필수**: 동시에 여러 요청이 `401`을 받아도 갱신 요청은
  1개만 보내고 나머지는 그 Promise를 기다린다. refresh rotation 환경에서
  갱신이 병렬로 나가면 두 번째가 이미 폐기된 refresh로 요청해 로그아웃된다.
- 갱신 요청 자체의 `401` / 갱신 후 재시도의 `401` → **무한루프 금지**, 즉시
  세션 만료 처리(`queryClient.clear()` → `/login` 이동).
- 갱신 실패 판단 시 `code`(`AUTH-401-006` 등, §10 참고)를 사용한다.

### 8.5 FE 구현 규칙 — SSR (Next.js 서버 측)

- 서버에서의 `fetch`는 브라우저가 아니므로 쿠키가 자동으로 붙지 않는다.
  `cookies()`/요청 헤더에서 쿠키를 읽어 `Cookie` 헤더로 수동 전달한다.
- 서버 측 GET은 CSRF 헤더가 불필요하다. 서버에서 상태 변경 요청을 BE로
  보내야 한다면 `XSRF-TOKEN` 쿠키와 `X-XSRF-TOKEN` 헤더를 모두 전달한다.
- **Server Component 렌더 중에는 쿠키를 설정할 수 없다** → SSR 중
  `accessToken` 만료 시 서버에서 refresh 후 새 쿠키를 브라우저에 내려줄
  방법이 없다. 선택지:
  - (a) `proxy.ts`(Next 16, 구 middleware)에서 만료 판단·갱신 후 `Set-Cookie`
    전달.
  - (b) SSR은 `401`이면 데이터 없이 렌더하고 클라이언트에서 갱신·재요청.
  - **(b)로 결정 (2026-09-22, §10.1 비교 근거).** (a)는 Proxy와 브라우저가
    각자 갱신을 시도할 때 refresh rotation 충돌 위험이 있고, "Next.js는
    세션에 관여하지 않는다"(§6)는 원칙과도 어긋나 채택하지 않는다.
- 그래서 서버 쪽 fetch는 `401`을 예외로 던지지 않고 데이터 없음으로 돌려준다
  (서버용 헬퍼는 첫 사용처가 생길 때 만든다). 인증이 실제로
  필요한지, 즉 미인증 사용자를 보호 라우트에서 쫓아낼지는 이 규칙과 별개로
  라우트 보호 정책에서 다룬다 (아직 미구현, §12).
- 서버의 `QueryClient`는 요청마다 새로 생성한다 (싱글턴 금지 — 사용자 간
  데이터 누수).

### 8.6 FE 구현 규칙 — OAuth (v3)

- 로그인 버튼은 `fetch`가 아니라 **top-level 이동**
  (`window.location.href = '/api/v1/auth/oauth/kakao'`). `fetch`로 호출하면
  `302` 리다이렉트가 CORS에 막힌다.
- `state` 생성·검증은 서버 책임. FE는 `state`를 만들거나 저장하지 않는다.
- `/login?error=...` 쿼리를 읽어 에러 메시지를 표시한다. `/signup` 진입 시
  `registrationToken` 쿠키(10분)가 전제이므로 만료 시 처리가 필요하다.

### 8.7 외부 도메인 요청 예외 (S3 presigned URL) (v2)

- presigned URL로 S3에 직접 `PUT`할 때는 API 래퍼를 쓰지 않는다.
  `credentials: 'omit'`, `X-XSRF-TOKEN` 헤더 **금지** (토큰 유출 + S3 CORS
  실패 원인).
- presigned URL 발급 요청(`POST /api/v1/image/presigned-url`) 자체는 우리
  API이므로 CSRF 헤더가 필요하다.

## 9. 백엔드 확인 필요 사항

- ~~CSRF 헤더 검증 방식~~ — **확인됨(2026-09-22, Postman/curl 재현):** `GET
/auth/csrf`로 받은 `XSRF-TOKEN` 쿠키의 원본 값을 그대로 `X-XSRF-TOKEN`
  헤더에 넣어 `POST /auth/sessions`를 호출하면 `403 COMMON-403-CSRF-001`이
  아니라 `404 AUTH-404-001`(존재하지 않는 아이디)이 온다 — CSRF 검증 자체는
  통과했다는 뜻이므로 BE가 SPA 호환 핸들러로 이미 설정돼 있다. FE는 지금
  구현대로(쿠키 원본 값 그대로 헤더에 복사) 유지하면 된다.

(참고) 로그인 시 CSRF 토큰 교체 여부 — **실측 확인됨(2026-09-22): 교체된다.**
로그인·로그아웃 응답 모두 새 `XSRF-TOKEN` `Set-Cookie`가 따라온다. 그래도 FE가
직접 판단할 필요는 없다: 인증 상태 변경 직후 항상 `GET /api/v1/auth/csrf`를
호출하고, CSRF `403` 시 재발급 후 1회 재시도하는 지금 규칙이면 서버가
언제 교체하든 항상 최신 값을 쓰게 된다.

## 10. 현재 API 시트의 불일치·미확정 항목 (코드 작성 전 BE와 확정 필요)

- ~~로그인 후 CSRF 재발급 규칙 미기재~~ — **확인됨(2026-09-22):** 로그인·
  로그아웃 응답 모두 새 `XSRF-TOKEN`을 자동으로 내려준다. §9 참고.
- `refreshToken Path=/`: 모든 요청에 refresh가 실려 노출면이 넓어진다.
  `Path=/api/v1/auth` 등으로 좁히는 것 검토. **(실측 재확인: 2026-09-22에도
  여전히 `Path=/`.)**
- 에러 코드: 문서(API 시트)엔 갱신 `401`이 `AUTH-400-006`, 로그아웃 `401`이
  `AUTH-200-005`라고 적혀 있었는데, **실측(2026-09-22)은 다르다** —
  갱신 실패는 재사용된 refreshToken이면 `401 AUTH-401-002`, refreshToken이
  아예 없으면 `401 AUTH-401-003`이었고, 로그아웃은 시도한 케이스(정상 세션)에서
  `401`이 아니라 `200 AUTH-200-002`로 성공했다 — API 시트에 적힌 실패
  케이스 자체를 재현 못 해서 시트값이 맞는지는 여전히 모른다. 코드 값을
  하드코딩해서 분기할 계획이면 이 실측값 기준으로 하고, 시트와 다르다는 걸
  백엔드에 알린다.
- ~~로그아웃 응답에 쿠키 삭제(`Set-Cookie Max-Age=0`) 명세 없음~~ —
  **확인됨(2026-09-22), 정상 동작:** 로그아웃 응답에
  `accessToken`·`refreshToken` 둘 다 `Max-Age=0`으로 삭제하는 `Set-Cookie`가
  옴. 로그아웃 후 같은 쿠키로 갱신 재시도하면 `401 AUTH-401-003`으로
  막히는 것도 확인.
- access 만료 `401`의 에러 코드 미정의 → FE가 "갱신 시도할 `401`"과 "그냥
  로그인 필요한 `401`"을 구분할 기준이 없다. **아직 미확인** — 테스트한
  401은 전부 refresh 엔드포인트 관련이었고, "일반 보호 API에서 accessToken만
  만료됐을 때의 401·code"는 아직 실측 못 함.
- ~~로그인 응답 오타·형식~~ — **확인됨(2026-09-22), 문제 없음:**
  `POST /api/v1/users` 실제 응답은
  `{"code":"USER-201-001","message":"회원가입 성공","data":{"activeRefrigeratorIds":["1"]}}`.
  `"message"` 철자 정상, `activeRefrigeratorIds`도 정상 배열 —
  의심했던 오타·형식 오류는 재현 안 됨. (참고: 이 엔드포인트는 §8.1 표에
  없던 회원가입 API. 가입과 동시에 로그인되는 것도 §8.1에 반영 완료.)
- 공통 탭 CSRF 항목 중 적용 범위 / 서버 검증 / 수명 주기 / 배포 조건이
  비어 있음.
- ~~SSR 중 access 만료 시 갱신 처리 방식~~ — (b)로 결정, §8.5·§10.1 참고.
- ~~`GET /api/v1/auth/csrf`가 명세와 다름~~ — **수정 완료·재확인함
  (2026-09-22).** 처음엔 인증 없이 호출하면 `204`가 아니라 `401` +
  `{"code":"AUTHENTICATION_REQUIRED",...}`이 왔음(원인: Spring Security
  필터 체인에서 이 경로가 `permitAll`로 안 뚫려 있었던 것으로 추정). 백엔드에
  수정 요청 → 배포 후 로컬(8080 직접 호출)·프록시 경유(3000) 둘 다 `204` +
  `Set-Cookie: XSRF-TOKEN=...; Path=/; Secure; SameSite=Lax` 확인함. 프론트
  이슈 [#50](https://github.com/100-hours-a-week/KTB4-5th-FE/issues/50)도
  종료 처리.
  **참고**: `Secure` 플래그가 새로 붙었다 — Chrome은 `localhost`/`127.0.0.1`을
  신뢰 출처로 예외 처리해 HTTP에서도 저장되지만, LAN IP(`192.168.x.x`)로
  접속해 테스트하면 쿠키가 저장되지 않으니 로컬 테스트는 반드시 `localhost`
  주소로 한다.
- ~~CSRF 헤더 검증 방식(Xor 마스킹 문제)~~ — §9에서 **확인 완료**: SPA 호환
  핸들러가 이미 설정돼 있다.

### 10.1 SSR 401 처리 방식 비교 — (a) proxy.ts 갱신 vs (b) 클라이언트 위임

**문제 상황(구체 예시).** 사용자가 15분간 아무 요청도 안 보내서 `accessToken`이
만료된 채로 새로고침하거나 `/refrigerator`처럼 서버에서 데이터를 먼저 불러오는
화면에 들어간다. Server Component가 `cookies()`로 읽은 (이미 만료된)
`accessToken`을 백엔드로 그대로 전달 → 백엔드가 `401`을 준다.

브라우저(클라이언트) fetch였다면 지금 구현한 대로 `POST
/auth/token-renewals` → 새 쿠키 수신 → 원 요청 재시도로 끝난다. 그런데 이걸
**Server Component 안에서** 그대로 하면 구조적으로 막힌다: Next.js 규칙상
Server Component 렌더 도중에는 응답에 `Set-Cookie`를 실을 수 없다
(`cookies()`는 서버 컴포넌트에서 읽기 전용, 쓰기는 Server Action·Route
Handler·Proxy에서만 가능). 즉 서버가 갱신에 성공해도 그 결과(새
access/refresh 쿠키)를 브라우저에 돌려줄 방법이 Server Component 자체에는
없다 — 서버는 새 토큰으로 렌더는 하지만, 브라우저는 여전히 만료된(그리고
rotation 정책상 이미 서버에서 새 걸로 교체돼버려 폐기된) 옛 쿠키를 들고 있게
된다.

| 기준                                  | (a) `proxy.ts`에서 갱신 후 `Set-Cookie` 전달                                                                                                                                                                                                                                                                     | (b) SSR은 데이터 없이 렌더, 클라이언트가 갱신                                                                                                                                                 |
| ------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 구현 위치                             | 새 `proxy.ts` — 만료 판단 + 갱신 호출 + 쿠키 병합 로직 추가                                                                                                                                                                                                                                                      | 기존 패턴 재사용 — 각 SSR fetch가 `401`을 오류로 못 얻은 데이터 취급, `loading.tsx`/`error.tsx`/Suspense로 처리                                                                               |
| **rotation 충돌 위험**                | **있음.** Proxy(서버, Node 런타임)와 브라우저 탭의 갱신이 동시에 일어날 수 있고, 서로 다른 런타임이라 지금 구현한 single-flight(모듈 스코프 `refreshPromise`)가 걸치지 못한다. refresh는 1회용 rotation이라 두 번째 갱신 시도가 이미 폐기된 refreshToken으로 요청해 로그아웃될 수 있다(§8.5가 이미 경고한 지점). | **없음.** 갱신은 항상 브라우저에서만, 지금 만든 single-flight 안에서 일어난다.                                                                                                                |
| **UX**                                | 토큰이 방금 만료됐어도 첫 렌더부터 데이터가 꽉 찬 화면. 깜빡임 없음.                                                                                                                                                                                                                                             | 아주 짧게 로딩/빈 상태가 보였다가 클라이언트 갱신 후 데이터가 채워짐.                                                                                                                         |
| **레이턴시 비용**                     | 매 SSR 요청마다 Proxy가 실행됨 — matcher로 범위를 좁혀도, 만료 여부를 판단(JWT `exp` 디코딩 또는 실제 네트워크 확인)하는 비용이 안 만료된 요청(대부분)에도 붙는다. Next 공식 문서도 "Proxy는 느린 데이터 패칭 용도가 아니다"라고 명시.                                                                           | 토큰이 유효한 대부분의 요청엔 추가 비용 0. 방금 만료된 드문 경우에만 클라이언트가 한 번 더 요청.                                                                                              |
| **최종 실패(refreshToken도 만료) 시** | Proxy가 렌더 전에 `/login`으로 즉시 redirect 가능 — 보호 화면 껍데기가 아예 안 보임.                                                                                                                                                                                                                             | Server Component가 일단 렌더된 뒤 클라이언트에서 `SessionExpiredError` → 로그인 이동 — 아주 짧게 보호 화면 셸이 보였다 넘어갈 수 있음.                                                        |
| **아키텍처 정합성**                   | §6에서 이미 "Next.js는 세션을 발급·검증하지 않는다"고 확정했는데, Proxy가 토큰 갱신 호출과 `Set-Cookie` 처리를 대신하면 그 경계가 흐려짐.                                                                                                                                                                        | 토큰 수명 로직이 전부 `shared/api`(브라우저)에만 있어 §6 결정과 정확히 일치.                                                                                                                  |
| **구현 비용(현재 코드 기준)**         | 새 `proxy.ts` + JWT 만료 판단 + matcher 설정 + rotation 충돌 방지책까지 새로 설계해야 함.                                                                                                                                                                                                                        | 이미 구현된 `fetch-client.ts`/`token-refresh.ts`를 그대로 재사용. SSR 쪽은 각 fetch 호출부가 `401`을 예외로 던지지 않고 "데이터 없음"으로 넘기게만 하면 됨(화면별로 조금씩 손볼 대상은 있음). |

**결정 (2026-09-22): (b).** 이 팀 전제(`tech-stack.md`: FE 1명, 릴리스당
8~10일)에서 얻는 이득(깜빡임 없는 첫 렌더)에 비해 (a)의 rotation 충돌 위험과
"Next.js는 세션에 관여 안 한다"(§6)는 이미 정한 원칙과의 충돌이 더 크다고
판단했다.

## 11. 금지 사항

- 토큰을 JS 접근 가능한 저장소에 저장
- GET으로 상태 변경
- CSRF `403` 무한 재시도, `401` 갱신 무한루프
- 갱신 요청 병렬 발송
- 외부 도메인(S3 등)으로 `X-XSRF-TOKEN` / `credentials: 'include'` 전송
- `SameSite=None`으로 문제 우회 (CSRF 방어가 약해짐, 필요 시 근거와 함께 질문)

## 12. 다음 작업

- [x] 백엔드에 `GET /api/v1/auth/csrf`가 명세대로(`204`) 배포되어 있는지
      확인한다 — 수정 배포 후 `204` 확인함 (§10 참고).
- [x] 백엔드가 `XSRF-TOKEN` 쿠키를 발급하고 상태 변경 요청에서
      `X-XSRF-TOKEN`을 검증하는지 확인한다. (§9 — SPA 호환 핸들러 확인됨)
- [x] 프론트 공통 API 코드(`fetch-client.ts`)에 §8.2~8.4의 CSRF 발급·쿠키
      읽기·헤더 첨부·재발급·401 갱신(single-flight) 순서를 구현한다. (§7 참고)
- [ ] 성공 시 `200`과 access/refresh `HttpOnly; Secure; SameSite=Lax` 쿠키가
      설정되는지 브라우저에서 확인한다.
- [ ] 잘못된 CSRF 토큰으로 `403 / COMMON-403-CSRF-001`이 반환되는지
      테스트한다.
- [ ] 로그인 후 다음 변경 요청 전에 CSRF 토큰을 재발급하는지 테스트한다.
- [x] §8.5 SSR 중 access 만료 처리 방식을 (b)로 확정한다.
- [ ] 서버에서 인증 데이터를 가져오는 첫 화면을 만들 때 (b) 방식의 서버용
      fetch 헬퍼(쿠키 수동 전달, `401`이면 데이터 없음)를 함께 만든다. "내 세션
      조회" 등 서버 API 계약이 §8.1에 먼저 정의돼야 한다.
- [ ] §10의 불일치 항목(쿠키 이름, 에러 코드, 로그아웃 쿠키 삭제 등)을
      백엔드와 하나씩 확정한다.

**보류(범위 밖, §7 참고):**

- [ ] OAuth 로그인 버튼의 top-level 이동과 `registrationToken` 만료 처리를
      구현한다.
- [ ] S3 presigned URL 업로드 경로가 공통 API 래퍼를 거치지 않는지 코드
      리뷰에서 확인한다.

## 13. 온보딩 화면 단계와 인증 연결

`/login`은 URL을 추가로 이동하지 않고 Client Component의 `step`으로 두 화면을
전환한다. §7에 정리한 대로 실제 연동됐다 (2026-09-22).

```text
login step
  └─ 아이디·비밀번호 제출 (RHF handleSubmit → useLoginOrSignup)
       ├─ POST /api/v1/auth/sessions 성공 → 기존 계정
       │    └─ enterHome() → router.replace('/')
       └─ 404 AUTH-404-001 → POST /api/v1/users 성공 → 신규 계정
            └─ showNotificationOnboarding() → notification-onboarding step

notification-onboarding step
  └─ 시작하기
       └─ enterHome() → router.replace('/')
```

`GET /api/v1/auth/csrf`(부트스트랩), `X-XSRF-TOKEN` 헤더 첨부, 로그인·가입
성공 후 CSRF 재발급은 전부 공통 계층(`shared/api`, `CsrfBootstrapProvider`)이
자동으로 처리하므로 이 화면 코드는 신경 쓰지 않는다.

**아직 안 한 것 — 다음에 볼 것:**

- 온보딩 "시작하기"는 홈으로 이동만 할 뿐, 온보딩 완료 상태를 저장하는 API를
  호출하지 않는다. 그런 API가 §8.1에 없어서 임의로 만들지 않았다 — 필요하면
  백엔드와 계약을 먼저 정한다.
- 새로고침·`/login` 직접 진입·다른 탭 진입 시 서버 세션 기준으로
  로그인·온보딩·홈을 다시 판정하는 라우트 보호는 아직 없다(§3 "인증되지
  않은 사용자가 보호 화면에 직접 접근하면 로그인으로 보낸다"가 아직 미구현).
  지금은 비로그인 상태로 `/`에 직접 들어가도 막히지 않는다.
- 로그아웃 UI·API 연동은 아직 없다(§9 확인·백엔드 curl 테스트만 완료).

## 참고 자료

- [Next.js Authentication Guide](https://nextjs.org/docs/app/guides/authentication)
- [Next.js cookies API](https://nextjs.org/docs/app/api-reference/functions/cookies)
- [OWASP Session Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html)
- [OWASP HTML5 Security Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/HTML5_Security_Cheat_Sheet.html)
- [OWASP CSRF Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html)
