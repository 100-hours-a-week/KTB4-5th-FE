# 다먹자 프론트엔드 FSD 아키텍처 규칙

## 1. 문서의 지위

이 문서는 다먹자 프론트엔드에 새 코드를 추가하거나 기존 코드를 이동·리뷰할
때 반드시 적용하는 구조 규칙이다.

- 대상: Next.js App Router 16.3.3, React 19.2.x, TypeScript 6.x
- 서버 상태: TanStack Query 5.102.8와 공통 `fetch` 래퍼
- 클라이언트 상태: Zustand 5.0.14
- 폼과 검증: React Hook Form 7.87.0과 Zod 4.5.4
- 기준: Notion `설계 1단계. 기술 검토 및 스택 선정`의 승인 스택
- FSD의 `processes` 레이어는 사용하지 않는다.

새 코드는 이 규칙을 따라야 한다. 기존 코드에 규칙 위반이 있더라도 한 번에
전체를 옮기지 않는다. 수정하는 기능 경계 안에서 위반을 더 늘리지 않고,
안전하게 분리할 수 있는 단위만 함께 정리한다.

## 2. Next.js와 FSD의 디렉터리 충돌 해결

Next.js의 `app` 디렉터리와 FSD의 App 레이어는 이름이 충돌한다. FSD의 Pages
레이어도 Next.js의 `pages` 디렉터리와 혼동될 수 있다. 따라서 다음 이름을
고정한다.

- 루트 `app/`: Next.js App Router 전용
- `src/_app/`: FSD App 레이어
- `src/_pages/`: FSD Pages 레이어
- 루트 `pages/`: 사용하지 않는다. 이 프로젝트는 App Router만 사용한다.

목표 구조는 다음과 같다. 필요하지 않은 레이어나 세그먼트를 미리 빈 폴더로
만들지는 않는다.

```text
.
├── app/                         # Next.js 라우팅 어댑터
│   ├── (auth)/
│   │   └── login/page.tsx
│   ├── (protected)/
│   │   ├── layout.tsx
│   │   ├── (tabs)/
│   │   │   ├── page.tsx
│   │   │   └── refrigerator/page.tsx
│   │   └── (flow)/
│   │       └── refrigerator/
│   │           ├── register/page.tsx
│   │           └── ingredients/[ingredientId]/
│   │               ├── page.tsx
│   │               └── edit/page.tsx
│   ├── api/**/route.ts
│   ├── layout.tsx
│   ├── loading.tsx
│   ├── error.tsx
│   ├── not-found.tsx
│   └── manifest.ts
├── public/
└── src/
    ├── _app/                    # 앱 초기화와 전역 조립
    │   ├── providers/
    │   ├── styles/
    │   └── api-routes/
    ├── _pages/                  # 화면 단위 슬라이스
    │   ├── home/
    │   ├── login/
    │   └── refrigerator/
    ├── widgets/                 # 큰 독립 UI 블록
    ├── features/                # 사용자가 수행하는 행위
    ├── entities/                # 비즈니스 개체와 서버 데이터
    └── shared/                  # 도메인에 독립적인 기반 코드
        ├── api/
        ├── config/
        ├── lib/
        ├── routes/
        └── ui/
```

`tsconfig.json`의 `@/*` 별칭은 `./src/*`를 가리킨다. 루트 `app/`에서도
`@/_pages`, `@/_app`, `@/shared`처럼 같은 별칭을 사용한다.

### 코드에서 경로를 작성하는 규칙

파일 시스템 경로, 화면 URL, API URL, 정적 자산 URL은 서로 다른 경로다.
문자열 모양이 비슷하더라도 같은 규칙으로 섞어 사용하지 않는다.

| 경로 종류                 | 작성 위치와 형식                                                     | 예시                                    |
| ------------------------- | -------------------------------------------------------------------- | --------------------------------------- |
| 다른 FSD 슬라이스 import  | `@/`로 시작하는 슬라이스 Public API                                  | `@/entities/ingredient`                 |
| 같은 슬라이스 내부 import | 현재 파일 기준 상대 경로                                             | `../lib/map-ingredient-response`        |
| 애플리케이션 화면 URL     | `src/shared/routes`의 상수 또는 생성 함수                            | `routes.ingredientDetail(ingredientId)` |
| 백엔드 API URL            | 데이터를 소유한 `entities/*/api` 또는 행위를 소유한 `features/*/api` | `/api/fridges/${fridgeId}/ingredients`  |
| `public/` 정적 자산 URL   | `/`로 시작하는 URL 경로                                              | `/icons/refrigerator.svg`               |

#### import 경로

- `@/`는 `src/` 전용이다. `@/app`, `@/public`, `@/src`처럼 해석되지 않는
  경로를 만들지 않는다.
- 다른 슬라이스를 참조할 때는 `@/{layer}/{slice}` 형식으로 Public API만
  import한다. `../../../entities/ingredient` 같은 레이어 횡단 상대 경로와
  `@/entities/ingredient/ui/ingredient-card` 같은 deep import를 금지한다.
- 같은 슬라이스 내부에서는 `./`, `../` 상대 경로를 사용한다. 자기 슬라이스를
  `@/features/register-ingredient`로 다시 import하면 barrel 순환 참조가 생길 수
  있으므로 금지한다.
- `next`, `react`, `@tanstack/react-query` 같은 패키지는 패키지 이름으로
  import한다. 로컬 경로 별칭과 혼동하지 않는다.
- 디렉터리를 import할 때는 해당 디렉터리의 `index.ts`가 명시적으로 공개한
  심볼만 사용한다. 파일 확장자와 `/index`는 import 경로에 쓰지 않는다.

```ts
// 다른 슬라이스: 절대 경로 + Public API
import { IngredientCard } from "@/entities/ingredient";

// 같은 슬라이스 내부: 상대 경로
import { mapIngredientResponse } from "../lib/map-ingredient-response";

// 금지: 레이어를 가로지르는 상대 경로와 다른 슬라이스 deep import
import { IngredientCard } from "../../../entities/ingredient";
import { IngredientCard } from "@/entities/ingredient/ui/ingredient-card";
```

#### 화면, API, 정적 자산 경로

- 두 곳 이상에서 사용하는 화면 URL은 `src/shared/routes`에 모은다. 동적
  세그먼트는 문자열을 각 사용처에서 직접 조합하지 않고 생성 함수로 제공한다.
- 화면 URL은 항상 `/`로 시작하고, 루트(`/`) 외에는 끝에 `/`를 붙이지 않는다.
  `(protected)`, `(tabs)`, `(flow)` 같은 Route Group 이름은 실제 URL에 포함하지
  않는다.
- 동적 세그먼트 값은 URL에 넣기 전에 `encodeURIComponent`로 인코딩한다.
- `router.push`, `router.replace`, `redirect`, `<Link href>`는 같은 route 상수나
  생성 함수를 사용한다. `"/refrigerator/ingredients/" + id` 같은 중복 조합을
  만들지 않는다.
- 백엔드 API 경로는 `shared/routes`에 넣지 않는다. 해당 요청 함수가 속한
  Entity 또는 Feature의 `api/`에서 소유하고, UI 컴포넌트가 API URL을 직접
  작성하지 않는다.
- 백엔드 origin은 검증된 환경 설정과 공통 fetch client가 담당한다. 요청마다
  origin을 하드코딩하지 않으며, path는 `/`로 시작하는 상대 API 경로로 넘긴다.
- `public/`은 URL에 포함하지 않는다. `public/icons/refrigerator.svg` 파일은
  코드에서 `/icons/refrigerator.svg`로 참조한다.

```ts
// src/shared/routes/index.ts
export const routes = {
  home: "/",
  refrigerator: "/refrigerator",
  registerIngredient: "/refrigerator/register",
  ingredientDetail: (ingredientId: string) =>
    `/refrigerator/ingredients/${encodeURIComponent(ingredientId)}`,
  ingredientEdit: (ingredientId: string) =>
    `/refrigerator/ingredients/${encodeURIComponent(ingredientId)}/edit`,
} as const;
```

외부 계약의 이름은 임의로 바꾸지 않는다. 예를 들어 확정된 백엔드 API가
`/stocks`나 `stockId`를 사용한다면 `entities/ingredient/api` 경계에서 그 계약을
호출하고 내부의 `Ingredient`, `ingredientId`로 변환한다. Figma 화면 ID인
`STOCK-001`, `STOCK-002`도 추적 식별자이므로 그대로 유지한다.

## 3. 레이어 책임

### `app/`: Next.js 라우팅 어댑터

루트 `app/`은 FSD 레이어가 아니다. Next.js가 파일 이름과 위치를 해석하는
프레임워크 경계다.

허용한다.

- `page.tsx`, `layout.tsx`, `loading.tsx`, `error.tsx`, `not-found.tsx`
- `route.ts`, `manifest.ts`, 아이콘과 기타 Next.js 특수 파일
- `params`, `searchParams`, metadata, viewport, route config 처리
- `_pages` 화면을 import하거나 re-export하는 얇은 조립
- 가장 가까운 레이아웃에 Provider와 공통 Widget을 조립하는 코드

두지 않는다.

- 재고 계산, 냉장고 전환, 알림 읽음 같은 비즈니스 규칙
- 재사용 컴포넌트와 범용 훅
- API 응답 타입, Query Key Factory, Zustand store
- 페이지 전용이라는 이유만으로 쌓이는 대형 JSX 구현

단순 라우트는 다음처럼 얇게 유지한다.

```tsx
export { RefrigeratorPage as default } from "@/_pages/refrigerator";
```

Next.js가 정적으로 분석해야 하는 route config나 metadata가 있거나 라우트별
prefetch 조립이 필요하면 `page.tsx`에 명시적으로 export하되, 화면과 도메인
로직은 `_pages` 이하로 위임한다.

### `src/_app`: 전역 초기화와 조립

다음처럼 앱 전체에 한 번 적용되는 코드만 둔다.

- Query Provider, Zustand 초기화, Sonner Toaster
- 전역 스타일과 디자인 토큰
- 전역 오류·관찰·환경 초기화
- 얇은 Route Handler 구현 어댑터

`_app`과 `shared`는 비즈니스 슬라이스로 나누지 않고 목적별 세그먼트로
나눈다.

### `src/_pages`: 화면

URL로 진입하는 화면 단위다. 예: `home`, `login`, `refrigerator`,
`ingredient-detail`, `recommendation-detail`.

- Widget, Feature, Entity를 화면 요구에 맞게 조립한다.
- 해당 화면에서만 쓰는 UI와 상태는 페이지 슬라이스 안에 둘 수 있다.
- 재사용되지 않는 화면 블록을 억지로 Widget이나 Feature로 승격하지 않는다.
- 각 페이지 슬라이스는 `index.ts`를 Public API로 제공한다.

### `src/widgets`: 큰 독립 UI 블록

여러 페이지에서 재사용하거나, 한 화면 안에서 독립적인 로딩·오류·데이터
경계를 갖는 큰 블록에 사용한다. 예: 하단 탭 내비게이션, 재고 요약 패널,
알림 패널.

한 페이지에서만 쓰는 대부분의 화면 UI는 `_pages`에 남긴다.

### `src/features`: 사용자 행위

사용자가 목적을 갖고 수행하는 행위에 사용한다. 예: 냉장고 전환, 재고 등록,
재고 수정, 재료 차감, 알림 읽음, 냉장고 공유.

- 행위 UI는 `ui/`에 둔다.
- mutation hook과 행위 상태는 `model/` 또는 `api/`에 둔다.
- 폼 스키마와 폼 조립은 Feature가 소유할 수 있다.
- 한 화면의 사소한 이벤트까지 전부 Feature로 만들지 않는다.

### `src/entities`: 비즈니스 개체

다먹자의 핵심 명사에 사용한다. 예: `user`, `fridge`, `ingredient`, `notification`,
`recipe`.

- API 조회 함수와 Query Option Factory: `api/`
- 타입, Zod 스키마, 도메인 계산: `model/`
- 여러 화면에서 동일하게 보이는 작은 표현 UI: `ui/`

Entity 슬라이스끼리는 직접 import하지 않는다. 실제 데이터 관계 때문에
피할 수 없는 타입 연결만 `entities/{entity}/@x/{consumer}.ts`로 명시하고,
일반 비즈니스 상호작용은 Feature나 Page에서 조립한다.

### `src/shared`: 도메인 독립 기반

- `api/`: 공통 fetch client, HTTP 오류, 인증 헤더 처리
- `ui/`: Button, Input, Sheet처럼 비즈니스 로직 없는 UI kit
- `lib/`: 날짜, 문자열 등 하나의 명확한 목적을 가진 라이브러리
- `config/`: 검증된 환경 변수와 전역 설정
- `routes/`: URL 생성 함수와 route 상수

`components`, `hooks`, `utils`, `types` 같은 의미가 불분명한 최상위 폴더를
만들지 않는다. `shared`를 잡동사니 폴더로 사용하지 않는다.

## 4. import 방향과 Public API

허용되는 의존 방향은 아래쪽뿐이다.

```text
app/ 또는 _app
        ↓
      _pages
        ↓
      widgets
        ↓
      features
        ↓
      entities
        ↓
       shared
```

구체적인 규칙은 다음과 같다.

1. 상위 레이어는 하위 레이어를 import할 수 있다.
2. 하위 레이어는 상위 레이어를 import할 수 없다.
3. 같은 레이어의 다른 슬라이스를 import할 수 없다.
4. 같은 슬라이스 내부에서는 상대 경로와 실제 파일 경로를 사용한다.
5. 다른 슬라이스에서는 절대 경로와 해당 슬라이스의 Public API만 사용한다.
6. 각 슬라이스는 필요한 export만 명시한 `index.ts`를 둔다.
7. `export *`와 다른 슬라이스의 내부 경로 deep import를 금지한다.

```ts
// 허용: 다른 슬라이스의 Public API
import { ingredientQueries, IngredientCard } from "@/entities/ingredient";

// 허용: 같은 슬라이스 내부
import { mapIngredientResponse } from "../lib/map-ingredient-response";

// 금지: 다른 슬라이스 내부 경로
import { IngredientCard } from "@/entities/ingredient/ui/ingredient-card";
```

### 서버와 클라이언트 Public API

Server Component와 Client Component가 같은 슬라이스를 사용할 수 있으므로
런타임 경계를 Public API에서도 분리한다.

- `index.ts`: 브라우저에 포함되어도 안전한 타입, UI, query options, hook
- `index.server.ts`: `server-only` 데이터 접근, 비밀 환경 변수, Server Component
- `index.client.ts`: 분리가 실제로 필요한 브라우저 전용 진입점

서버 전용 모듈을 일반 `index.ts`에서 re-export하지 않는다. Client Component가
barrel을 import하는 순간 서버 모듈이 클라이언트 그래프에 섞일 수 있다.
슬라이스 내부 파일이 자기 `index.ts`를 다시 import하지 않게 하여 순환 참조도
막는다.

### TypeScript 타입의 소유와 배치

`interface`와 type alias는 문법 종류가 아니라 해당 타입을 소유하는 책임과
사용 범위를 기준으로 배치한다. 프로젝트 전체의 타입을 모으는 `src/types`,
`src/shared/types`, `common/types.ts` 같은 범용 타입 저장소는 만들지 않는다.

| 타입의 책임              | 배치 위치                                | 예시                                          |
| ------------------------ | ---------------------------------------- | --------------------------------------------- |
| 도메인 모델과 상태       | `entities/{entity}/model`                | `entities/ingredient/model/ingredient.ts`     |
| 외부 API 요청·응답 DTO   | `entities/{entity}/api`                  | `entities/ingredient/api/ingredient.dto.ts`   |
| 사용자 행위의 입력·상태  | `features/{action}/model`                | `features/register-ingredient/model/types.ts` |
| 한 화면에서만 쓰는 타입  | `_pages/{page}/model`                    | `_pages/ingredient-detail/model/types.ts`     |
| 한 컴포넌트만 쓰는 Props | 해당 컴포넌트 파일                       | `ingredient-card.tsx` 내부                    |
| 도메인 독립 기반 타입    | 관련 `shared` 모듈 내부                  | `shared/api/http-error.ts`                    |
| Next.js route props      | 해당 `app/**/page.tsx` 또는 `layout.tsx` | `IngredientDetailRouteProps`                  |

구체적인 규칙은 다음과 같다.

- 한 파일에서만 사용하는 Props와 보조 타입은 사용 파일 가까이에 둔다. 타입이
  있다는 이유만으로 별도 `types.ts`를 만들지 않는다.
- 여러 파일에서 공유되거나 파일이 지나치게 커질 때만 소유 슬라이스의
  `model/` 또는 `api/`로 분리한다.
- API DTO는 외부 계약이므로 `api/`에 두고, 내부 도메인 타입은 `model/`에 둔다.
  API 함수 또는 mapper 경계에서 DTO를 도메인 타입으로 변환한다.
- Zod 스키마가 런타임 검증의 원본이면 같은 구조의 타입을 다시 선언하지 않고
  `z.infer<typeof schema>`로 도출한다.
- 다른 슬라이스에서도 필요한 타입만 슬라이스의 `index.ts`에서 `export type`으로
  공개하고, 사용처에서는 `import type`으로 가져온다.
- 서버 전용 타입이 서버 전용 값이나 모듈과 함께 있다면 `index.server.ts`에서만
  공개한다. 타입을 얻기 위해 서버 구현을 일반 Public API에 노출하지 않는다.
- 유한한 상태는 문자열 `string`보다 literal union을 사용한다. 모든 상태를
  처리해야 하는 매핑과 분기는 `Record`, `satisfies`, exhaustive check를 활용한다.
- `any` 대신 `unknown`과 타입 가드를 사용하고, 단언은 실제 타입을 더 정확히
  아는 제한적인 경계에서만 사용한다.
- union, mapped type, tuple처럼 type alias가 필요한 형태는 `type`을 사용한다.
  객체 형태는 `interface` 또는 `type` 중 하나를 사용할 수 있지만, 문법 선택이
  저장 위치를 바꾸지는 않는다.

```ts
// entities/ingredient/model/ingredient.ts
export type IngredientStatus = "fresh" | "expiring" | "expired";

export interface Ingredient {
  id: string;
  name: string;
  quantity: number;
  status: IngredientStatus;
}

// entities/ingredient/index.ts
export type { Ingredient, IngredientStatus } from "./model/ingredient";

// 다른 슬라이스의 사용처
import type { Ingredient } from "@/entities/ingredient";
```

## 5. App Router 경계 규칙

### Server Component 우선

- `page.tsx`와 `layout.tsx`는 기본적으로 Server Component로 유지한다.
- 이벤트, React state/effect, TanStack Query hook, Zustand hook, 브라우저 API가
  필요한 가장 작은 leaf에만 `"use client"`를 선언한다.
- Client Component가 import하는 모든 모듈은 client bundle 후보가 되므로,
  큰 Page나 Layout 전체를 편의상 Client Component로 바꾸지 않는다.
- Server Component에서 Client Component로 넘기는 props는 직렬화 가능해야 한다.
- 비밀 키와 서버 전용 API 함수가 있는 파일에는 `import "server-only"`를 둔다.

### 라우팅 규약

- `(auth)`, `(protected)`, `(tabs)`, `(flow)`는 URL이 아닌 라우팅·레이아웃
  그룹이다.
- `(tabs)`는 하단 탭을 유지하는 화면, `(flow)`는 등록·상세·수정처럼 탭에서
  진입한 뒤 독립적으로 진행하는 화면 흐름을 묶는다.
- 서로 다른 Route Group에서 같은 실제 URL을 만들지 않는다.
- Next.js 16의 `params`와 `searchParams`는 Promise이므로 현재 설치 문서를
  확인하고 서버 경계에서 해제한다.
- route 단위 fallback은 Next.js의 `loading.tsx`, `error.tsx`, `not-found.tsx`를
  사용하고, 더 작은 데이터 경계는 가까운 `Suspense`와 오류 UI를 사용한다.
- Route Handler가 필요하면 `app/api/**/route.ts`는 HTTP export만 담당하고,
  구현은 `src/_app/api-routes` 또는 적절한 하위 계층으로 위임한다.

## 6. TanStack Query 배치와 Next.js 충돌 방지

### 상태 소유권

| 상태                             | 소유자                | 금지 사항                        |
| -------------------------------- | --------------------- | -------------------------------- |
| API 조회·캐시·재시도·무효화      | TanStack Query        | Zustand에 서버 응답 복제 금지    |
| 모달·시트·탭·작성 단계           | Zustand               | 서버 데이터의 원본으로 사용 금지 |
| 입력값·필드 오류·폼 검증         | React Hook Form + Zod | Query cache에 draft 저장 금지    |
| 뒤로가기로 복원할 검색·필터·정렬 | URL search params     | 메모리 상태에만 저장 금지        |
| 한 컴포넌트 안의 일시적 상호작용 | 로컬 React state      | 불필요한 전역화 금지             |

### Query Provider

- Provider는 `src/_app/providers/query-provider`에 둔다.
- Provider 파일은 Client Component이고, root 또는 실제로 Query를 공유하는 가장
  가까운 `layout.tsx`에서 조립한다.
- 다먹자는 탭 이동 중 재고·알림 캐시를 공유하므로 기본 위치는 보호된 영역의
  공통 layout이다. 로그인 이전에 Query가 필요하면 root layout까지 올린다.
- 서버 렌더마다 새 `QueryClient`를 만들고, 브라우저에서는 하나를 재사용한다.
- 서버 요청들이 공유하는 모듈 최상위 `new QueryClient()`를 절대 만들지 않는다.
  사용자 사이의 캐시와 개인정보가 섞일 수 있다.

### Query Option Factory와 키

조회 계약은 해당 데이터를 소유한 Entity의 `api/`에 둔다.

```ts
export const ingredientQueries = {
  all: (fridgeId: string) => ["fridges", fridgeId, "ingredients"] as const,
  lists: (fridgeId: string) =>
    [...ingredientQueries.all(fridgeId), "list"] as const,
  list: (fridgeId: string, filters: IngredientFilters) =>
    queryOptions({
      queryKey: [...ingredientQueries.lists(fridgeId), filters],
      queryFn: () => getIngredients({ fridgeId, filters }),
    }),
};
```

- `queryOptions`로 `queryKey`와 `queryFn`을 함께 정의한다.
- 재고, 알림, 공유, 추천처럼 냉장고에 종속된 모든 키에 `fridgeId`를 포함한다.
- 필터 객체는 직렬화 가능하고 안정적인 값만 사용한다.
- 서버 prefetch와 클라이언트 hook은 반드시 동일한 Factory를 사용한다.
- 인증 사용자가 바뀌면 이전 사용자의 민감 Query cache를 제거한다.

### 조회와 mutation의 위치

- 순수 HTTP 함수와 Query Option Factory: `entities/{entity}/api`
- 사용자의 행위를 완성하는 mutation hook: `features/{action}/model` 또는 `api`
- 한 페이지에서만 쓰고 재사용 가치가 없는 mutation 조립: `_pages/{page}/api`
- 공통 fetch client와 HTTP 오류 변환: `shared/api`

mutation 성공 후 영향받는 키를 코드와 테스트에 명시한다. 재고
등록·수정·삭제·차감은 최소한 다음 캐시의 동기화 여부를 검토한다.

- 현재 냉장고의 재고 목록과 상세
- 홈 냉장고 용량과 요약
- 마이페이지 요약
- 알림과 공유 상태에 실제 영향이 있는 경우 해당 키

레시피 재료 차감 후 관련 재고 캐시는 갱신하지만, 추천 목록은 정책상 즉시
재생성하지 않는다. 공유 냉장고 동시 변경, 서버 시각 기반 D-day, 수량 차감처럼
최종값을 클라이언트가 확정하기 위험한 변경은 서버 응답 반영 또는 재조회로
확정한다.

### Server prefetch와 Hydration

초기 화면에 반드시 필요한 데이터이고 이후 브라우저 캐시가 계속 관리해야
하면 Server Component에서 prefetch하고 `HydrationBoundary`로 전달한다.

- Hydration boundary는 데이터를 사용하는 Page 또는 Widget 가까이에 둔다.
- 서버와 브라우저에서 같은 Query Key를 사용한다.
- 브라우저용 `queryFn`이 `/api/...` 상대 URL을 사용한다면 서버 prefetch에서
  그대로 실행하지 않는다. 서버용 절대 URL 함수로 `queryFn`을 override한다.
- 서버용 인증 헤더나 비밀 환경 변수를 브라우저용 query options에 넣지 않는다.
- 초기 렌더에 필요하지 않은 검색 자동완성, 열린 뒤 보이는 시트 데이터 등은
  client query로 늦춘다.
- 독립 query는 서버에서 병렬로 시작한다.
- 한 Client Component의 여러 `useSuspenseQuery`는 순차 워터폴이 될 수 있으므로
  sibling boundary 또는 `useSuspenseQueries`를 검토한다.

### Next.js 캐시와 Query 캐시

두 캐시는 서로 다른 저장소다.

- Next.js `fetch`/`use cache`/cache tag: 서버와 RSC 결과의 수명
- TanStack Query `staleTime`/Query Key: 브라우저 서버 상태의 수명

따라서 다음을 같은 동작으로 취급하지 않는다.

- `queryClient.invalidateQueries()`는 Next.js cache tag를 무효화하지 않는다.
- `updateTag()` 또는 `revalidateTag()`는 현재 브라우저 Query cache를 직접
  무효화하지 않는다.
- `router.refresh()`는 TanStack Query 무효화의 대체물이 아니다.
- Query의 `staleTime`과 Next.js cache lifetime은 같을 필요가 없다.

두 캐시가 같은 데이터에 사용되면 하나의 환경 중립 계약에 Query Key와 cache
tag 생성 규칙을 함께 두고, mutation 경계에서 양쪽 무효화를 명시적으로
조정한다. 현재 `next.config.ts`에서 `cacheComponents`가 활성화되지 않았으므로
정책 합의 없이 `use cache`, `cacheLife`, `cacheTag`를 도입하지 않는다.

## 7. 다먹자 도메인 예시

```text
src/
├── _pages/
│   └── refrigerator/
│       ├── ui/refrigerator-page.tsx
│       └── index.ts
├── widgets/
│   └── ingredient-list/
│       ├── ui/ingredient-list.tsx
│       └── index.ts
├── features/
│   ├── switch-fridge/
│   │   ├── model/use-switch-fridge.ts
│   │   ├── ui/fridge-switcher.tsx
│   │   └── index.ts
│   └── register-ingredient/
│       ├── model/ingredient-form.schema.ts
│       ├── model/use-register-ingredient.ts
│       ├── ui/register-ingredient-form.tsx
│       └── index.ts
├── entities/
│   ├── fridge/
│   │   ├── api/fridge.queries.ts
│   │   ├── api/get-fridges.ts
│   │   ├── model/fridge.ts
│   │   └── index.ts
│   └── ingredient/
│       ├── api/get-ingredients.ts
│       ├── api/ingredient.queries.ts
│       ├── model/ingredient.ts
│       ├── ui/ingredient-card.tsx
│       └── index.ts
└── shared/
    ├── api/fetch-client.ts
    ├── config/env.ts
    ├── lib/date/
    └── ui/button/
```

이 예시는 배치 원칙을 보여주기 위한 것이며 빈 디렉터리 생성 목록이 아니다.
실제 이름과 상태는 최신 Figma v3 화면설계서와 확정된 API 계약을 따른다.

## 8. 새 코드 추가 체크리스트

1. Next.js가 위치를 해석하는 특수 파일인가? 그러면 루트 `app/`에 둔다.
2. 앱 전체 초기화인가? `src/_app`에 둔다.
3. 하나의 화면 조립인가? `src/_pages/{page}`에 둔다.
4. 재사용되는 큰 독립 UI인가? `src/widgets/{widget}`에 둔다.
5. 사용자가 수행하는 재사용 가능한 행위인가? `src/features/{action}`에 둔다.
6. 비즈니스 개체의 타입·조회·표현인가? `src/entities/{entity}`에 둔다.
7. 도메인 지식이 전혀 없는 기반 코드인가? `src/shared`에 둔다.
8. 같은 레이어의 다른 슬라이스를 import하지 않았는가?
9. 다른 슬라이스의 Public API만 import했는가?
10. 다른 슬라이스는 `@/` 절대 경로, 같은 슬라이스 내부는 상대 경로를
    사용했는가?
11. 화면 URL을 여러 곳에서 사용한다면 `shared/routes` 생성 함수로 통일했는가?
12. UI가 API URL을 직접 작성하거나 화면 URL과 API URL을 한곳에 섞지 않았는가?
13. `public/` 자산을 `/...` URL로 참조했는가?
14. 타입을 범용 폴더에 모으지 않고 실제 소유 슬라이스와 세그먼트에 두었는가?
15. 외부에 공개하는 타입은 Public API에서 `export type`으로 노출했는가?
16. Server/Client entry가 섞이지 않았는가?
17. 서버 상태, UI 상태, 폼 상태, URL 상태의 소유자가 올바른가?
18. 냉장고 종속 Query Key에 `fridgeId`가 포함됐는가?
19. mutation 후 영향받는 Query와 서버 캐시를 각각 검토했는가?
20. 로딩, 빈 상태, 오류, 한도, 부분 성공, 작성 중 이탈 상태를 검토했는가?
21. 현재 설치된 Next.js 문서를 확인했는가?

## 9. 참고 자료

- [Feature-Sliced Design: Layers](https://feature-sliced.design/docs/reference/layers)
- [Feature-Sliced Design: Next.js](https://feature-sliced.design/docs/guides/tech/with-nextjs)
- [Feature-Sliced Design: TanStack Query](https://feature-sliced.design/docs/guides/tech/with-react-query)
- [Next.js: Project structure](https://nextjs.org/docs/app/getting-started/project-structure)
- [Next.js: TanStack Query](https://nextjs.org/docs/app/guides/client-side-data-fetching/tanstack-query)
- [TanStack Query: Advanced SSR](https://tanstack.com/query/latest/docs/framework/react/guides/advanced-ssr)
