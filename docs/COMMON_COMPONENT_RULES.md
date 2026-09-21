# 다먹자 공통 컴포넌트 설계 규칙

## 1. 문서의 목적과 적용 범위

이 문서는 다먹자 프론트엔드에서 UI를 공통 컴포넌트로 분리할지 판단하고,
분리한 컴포넌트의 책임·공개 계약·상태·렌더링 경계를 일관되게 설계하기 위한
규칙이다.

공통 영역은 별도의 비즈니스 도메인이 아니다. 여러 도메인이 재사용하는
**도메인 독립 UI 표현 계층과 애플리케이션 기반**이다. 외형이 비슷하다는
이유만으로 비즈니스 규칙까지 공통 계층으로 이동하지 않는다.

이 문서는 다음 우선순위를 따른다.

1. 파일 배치와 import 방향은 [FSD 아키텍처 규칙](./FSD_ARCHITECTURE.md)을
   따른다.
2. 공통화 여부와 컴포넌트 책임은 이 문서를 따른다.
3. 화면별 문구·노출 조건·이동·업무 정책은 최신 Figma 화면설계서와 해당
   도메인 명세를 따른다.
4. API 요청·응답과 서버 정책은 확정된 API 계약을 따른다.

Notion 원문에서 사용한 `shared/layout`, `app/providers`,
`features/<domain>/components` 등의 개념 경로는 현재 저장소의 FSD 구조에 맞게
각각 `src/widgets`, `src/_app/providers`, `src/features/*/ui` 등으로 해석한다.

## 2. 핵심 원칙

### 기본 디자인 토큰

| 역할      | CSS 토큰            | 값        |
| --------- | ------------------- | --------- |
| Ink       | `--color-ink`       | `#1A1A1E` |
| Primary   | `--color-primary`   | `#E03A2B` |
| Canvas    | `--color-canvas`    | `#F7F5F2` |
| Highlight | `--color-highlight` | `#E8A33D` |

전역 타이포는 Noto Sans KR의 400(본문), 700(강조·조작), 900(제목)만 사용한다.
공통 컴포넌트는 원본 색상값을 직접 반복하지 않고 `globals.css`의 시맨틱 토큰을
사용한다. Highlight는 임박·주의 표현에 사용하고 오류·만료·주요 action의
Primary와 혼용하지 않는다.

### 실제 반복을 근거로 분리한다

미래에 재사용할 것이라는 예상만으로 공통 컴포넌트를 만들지 않는다. 둘 이상의
화면에서 외형뿐 아니라 구조, 동작, 상태 처리, 변경 이유가 실제로 같은지
확인한다.

### 공통 계층은 불변부만 소유한다

공통 컴포넌트는 반복되는 표현·배치·접근성·상호작용 규칙을 소유한다. 데이터
조회, mutation, 라우팅 결과, 업무 조건, 화면별 문구는 사용하는 도메인이나
화면이 소유한다.

### 외형이 아니라 변경 이유로 경계를 나눈다

재고 카드, 알림 카드, 추천 카드처럼 카드 형태가 같더라도 데이터 계약과 클릭
결과가 다르면 하나의 거대 카드로 합치지 않는다. `CardSurface`, `Button`,
`Badge` 같은 작은 표현 기반만 공유하고 각 도메인이 조합한다.

### 예외가 늘어나면 공통화를 되돌린다

사용처마다 조건문, boolean prop, slot이 계속 추가된다면 공통 경계가 잘못된
신호다. 검증된 기반만 남기고 조합을 도메인으로 되돌리거나, 충분한 반복이
확인될 때까지 화면 내부에 유지한다.

## 3. 공통화 판정 게이트

컴포넌트를 추출하거나 리뷰할 때 다음 질문에 순서대로 답한다.

1. **화면 UI:** 어느 화면의 어떤 영역을 하나의 컴포넌트로 보는가?
2. **중복 근거:** 어느 화면·도메인에서 같은 구조와 동작이 반복되는가?
3. **책임 경계:** 공통 컴포넌트가 결정할 것과 부모·도메인에 남길 것은
   무엇인가?
4. **공개 계약:** 필요한 데이터, event, variant, slot은 무엇이며 허용하지
   않을 도메인 예외 prop은 무엇인가?
5. **상태 소유:** 서버 상태, 폼 상태, URL 상태, UI 상태의 단일 원천은
   어디인가?
6. **렌더 경계:** Server Component로 유지할 범위와 Client Component가 필요한
   최소 범위는 어디인가?
7. **배치 판정:** `shared`, `entities`, `features`, `widgets`, `_pages`, `_app` 중
   누가 소유해야 FSD import 방향을 지킬 수 있는가?

### 판정표

| 확인 결과                                          | 결정                             | 구현 원칙                                                         |
| -------------------------------------------------- | -------------------------------- | ----------------------------------------------------------------- |
| 구조·동작 반복, 책임 경계, 안정된 변형을 모두 확인 | 공통 컴포넌트로 분리             | 불변 규칙을 공개 계약으로 만들고 소유자와 사용처를 기록한다.      |
| 구조·동작과 책임 경계는 같지만 변형이 불확실       | 공통 기반과 도메인 조합으로 분리 | 검증된 동작·접근성만 공통화하고 이름 있는 slot으로 변형부를 연다. |
| 외형 또는 사용 횟수만 같음                         | 화면 또는 도메인 내부에 유지     | 실제 중복과 같은 변경 이유가 확인된 뒤 이동한다.                  |
| 미래 사용만 예상                                   | 추출하지 않음                    | 나중에 이동할 수 있도록 의존성과 책임만 정리한다.                 |
| 외형은 유사하지만 데이터·행동이 다름               | 조합은 각 도메인에 유지          | 필요한 UI primitive만 공유한다.                                   |

## 4. FSD 배치 규칙

Notion 원문의 분류 이름을 그대로 디렉터리로 만들지 않고 현재 저장소의 FSD
레이어에 다음과 같이 배치한다.

| 종류                                     | 저장소 위치                 | 예시                                                                   |
| ---------------------------------------- | --------------------------- | ---------------------------------------------------------------------- |
| 도메인을 모르는 UI primitive             | `src/shared/ui/{component}` | `button`, `icon-button`, `badge`, `chip`, `card-surface`, `form-field` |
| 표현과 상호작용 규칙을 가진 공통 frame   | `src/shared/ui/{component}` | `app-dialog`, `app-bottom-sheet`, `async-view-state`                   |
| 여러 화면에서 재사용되는 큰 독립 UI 블록 | `src/widgets/{widget}`      | `app-shell`, `bottom-tab-navigation`                                   |
| 비즈니스 개체의 작은 표현 UI             | `src/entities/{entity}/ui`  | `notification-bell`                                                    |
| 사용자 행동과 mutation을 조합한 UI       | `src/features/{action}/ui`  | 삭제 확인 Dialog, 재료 차감 Sheet, 등록 결과 Sheet                     |
| 한 화면에서만 쓰는 조합                  | `src/_pages/{page}/ui`      | 화면 전용 빈 상태, 만료 일괄 정리 Sheet 같은 화면 전용 overlay 조합    |
| 전역 Provider와 앱 생명주기 조립         | `src/_app/providers`        | Query Provider, Sonner Toaster 조립                                    |
| Next.js 특수 파일                        | 루트 `app/`                 | `layout.tsx`, `loading.tsx`, `error.tsx`, `not-found.tsx`              |

추가 규칙은 다음과 같다.

- `src/shared/ui`는 도메인 용어, API DTO, Query Key, mutation을 알지 않는다.
- 공통 컴포넌트도 컴포넌트별 디렉터리와 `index.ts` Public API를 둔다.
- 다른 슬라이스에서는 Public API로만 import하고 deep import하지 않는다.
- 하나의 전역 `src/shared/ui/index.ts`에서 모든 컴포넌트를 다시 export하지
  않는다.
- 한 컴포넌트에서만 쓰는 Props 타입은 해당 컴포넌트 파일 가까이에 둔다.
- `export *`를 사용하지 않고 외부에 필요한 심볼만 명시적으로 공개한다.
- 분류를 표현하기 위한 `components`, `common`, `utils`, `types` 같은 모호한
  최상위 폴더를 새로 만들지 않는다.

## 5. 공통 계층과 도메인 계층의 소유권

| 영역                         | 공통 계층이 소유                                                                        | 도메인·화면이 소유                                        |
| ---------------------------- | --------------------------------------------------------------------------------------- | --------------------------------------------------------- |
| App Shell·Navigation         | 공통 배치, 활성 표현, 접근성, overlay 중 조작 차단                                      | 이동 목적지, 진입 조건, 재고 한도 같은 업무 조건          |
| Dialog                       | focus trap, backdrop, scroll lock, 버튼·action 영역 배치, 제한된 dismiss 정책           | 제목·설명·버튼 문구, mutation, 성공·실패 처리             |
| Bottom Sheet                 | 시트 표면·drag handle, focus trap, backdrop, scroll lock, 스와이프, 제한된 dismiss 정책 | 제목·설명·본문·버튼 배치와 문구, mutation, 성공·실패 처리 |
| Toast                        | 하단 위치, 3초 timer, 동시에 한 개, 중복 갱신, 성공·실패 variant, Sonner 어댑터         | 노출 시점과 메시지, 선택적 action의 실행                  |
| 비동기 상태 UI               | 공통 정렬, 접근성, 재시도 중 중복 클릭 방지                                             | Query 실행과 상태 판정, 문구·아이콘·복구 action           |
| Header                       | 제목, leading·actions slot의 배치와 접근성                                              | 뒤로가기 정책, 알림 조회, 각 action의 실행 결과           |
| FormField                    | label·hint·error 연결과 접근성 ID                                                       | 입력값, 검증 schema, 서버 오류 매핑                       |
| Badge·FilterChip·CardSurface | 색상·간격·선택·강조 표현                                                                | D-day 계산, 필터 적용, 카드 클릭 결과                     |
| 전역 fallback                | 재사용 가능한 로딩·오류·빈 상태 표현                                                    | 오류 코드 해석, 화면 문구, 복구 action과 재조회           |

공통 컴포넌트가 화면별 정책을 직접 판단하지 않도록 이미 계산된 표현 값을
전달한다.

```tsx
// 허용: 도메인이 정책을 계산하고 공통 UI에는 표현 값만 전달한다.
<Button disabled={isStockLimitReached}>재료 등록</Button>

// 금지: shared UI가 재고 정책을 알게 된다.
<Button isStockLimitReached={isStockLimitReached}>재료 등록</Button>
```

## 6. Props, variant, slot 설계

### Props

- HTML 의미와 UI 책임이 드러나는 작은 계약을 우선한다.
- API 응답 DTO, TanStack Query 결과 객체 전체, Zustand store를 넘기지 않는다.
- event callback은 받을 수 있지만 callback이 수행할 업무 결과는 해석하지
  않는다.
- `isStockLimitReached`, `isRecipeMode`처럼 도메인 이름이 포함된 prop을
  `shared`에 추가하지 않는다.
- boolean prop 조합으로 암묵적인 상태 머신을 만들지 않는다. 유한한 표현은
  literal union인 `variant`, `tone`, `size`, `status`로 제한한다.
- 기본 HTML 속성을 지원할 때는 실제 root element와 맞는 타입만 공개한다.

### Variant

variant는 컴포넌트가 공식 지원하는 유한한 표현이나 상태다. 새 variant는 다음을
모두 만족할 때 추가한다.

- 둘 이상의 실제 사용처가 있거나 디자인 시스템에서 명시적으로 정의됐다.
- 기존 variant와 시각·행동 규칙이 분명히 다르다.
- 특정 도메인 이름 없이 설명할 수 있다.
- 모든 variant의 접근성 상태와 테스트 기준을 정의할 수 있다.

예: `Button`의 `primary | secondary`, `Toast`의 `success | error`.

### Slot

slot은 예외를 숨기는 만능 `children` 통로가 아니라 **사용처가 소유하는 변형
영역을 이름으로 드러내는 계약**이다.

- `leading`, `actions`, `actionArea`, `illustration`처럼 역할을 이름에 담는다.
- 공통 컴포넌트는 slot 내부의 도메인 데이터, mutation, 라우팅을 알지 않는다.
- slot 위치, 레이아웃 제약, 접근성 관계를 공통 컴포넌트가 문서화한다.
- slot 추가 요청이 반복되면 컴포넌트를 더 일반화하지 말고 분리하거나 도메인
  내부로 되돌린다.
- 화면 전체를 자유롭게 바꾸는 slot이라면 공통 template으로 묶을 이유가 있는지
  다시 판정한다.

## 7. 상태 소유 규칙

공통화는 상태의 단일 원천을 바꾸는 이유가 아니다.

| 상태                             | 소유자                                             | 공통 컴포넌트의 역할                            |
| -------------------------------- | -------------------------------------------------- | ----------------------------------------------- |
| API 조회·캐시·재시도             | TanStack Query를 사용하는 Entity·Feature·Page      | 화면 표시용 값만 받는다.                        |
| 서버 변경과 pending 상태         | mutation을 소유한 Feature 또는 Page                | `loading`, `disabled` 같은 표현 값을 받는다.    |
| 입력값·필드 오류                 | React Hook Form과 Zod를 사용하는 Feature 또는 Page | label·error 표현과 접근성 연결만 담당한다.      |
| 뒤로가기로 복원할 필터·정렬·검색 | URL search params                                  | 파생된 선택 값을 받는다.                        |
| overlay open                     | 가장 가까운 도메인 조합의 로컬 state 우선          | controlled interface를 제공한다.                |
| 여러 형제 간 순수 UI 조정        | 필요할 때만 Zustand                                | store의 존재를 공통화의 기본값으로 삼지 않는다. |
| Toast queue·timer                | Sonner 어댑터                                      | 별도 Zustand toast store를 만들지 않는다.       |

`shared/ui`는 Query를 실행하거나 mutation 후 cache를 무효화하지 않는다. 서버
데이터를 Zustand에 복제하지 않으며, 공통 UI를 위해 폼 schema를 이동하지
않는다.

## 8. Server/Client 경계와 생명주기

- 컴포넌트는 기본적으로 Server Component로 사용할 수 있게 유지한다.
- event, React state/effect, 브라우저 API가 필요한 가장 작은 leaf에만
  `"use client"`를 선언한다.
- 공통 컴포넌트 하나가 Client Component라는 이유로 Page나 Layout 전체를
  Client Component로 바꾸지 않는다.
- `AppDialog`, `AppBottomSheet`, `FilterChip`, Toast 어댑터처럼
  브라우저 동작이 필요한 컴포넌트만 Client 경계를 가진다.
- 열릴 때 등록한 keyboard listener, focus trap, body scroll lock은 닫힘 또는
  unmount 때 반드시 정리한다.
- overlay가 닫히면 이전 focus를 복구하고, 열린 동안 뒤쪽 콘텐츠와 하단
  navigation을 조작할 수 없게 한다.
- 비동기 재시도 버튼은 pending 동안 비활성화해 중복 요청을 막는다.

## 9. 컴포넌트별 현재 판정

| 대상                         | 현재 판정                         | 구현 위치와 핵심 계약                                                                                                                                                                                                     |
| ---------------------------- | --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `AppShell`                   | 공통 Widget                       | `src/widgets/app-shell`; `header`, `children`, `navigation`, `navigationVisible`을 조합하고 업무 데이터는 받지 않는다.                                                                                                    |
| `BottomTabBar`               | 공통 Widget, 세부 정책 보류       | `src/widgets/bottom-tab-navigation`; 활성 탭은 route에서 파생하고 진입 조건은 외부에서 계산한다.                                                                                                                          |
| `AppHeader`                  | 공통 기반 + 도메인 조합           | `src/shared/ui/app-header`; `title`, `leading`, `actions`만 소유한다.                                                                                                                                                     |
| `AppLink`                    | 공통 navigation primitive         | `src/shared/ui/app-link`; 내부 SPA 링크의 `push`·`replace` intent를 `onNavigate`에서 자동 기록한다.                                                                                                                       |
| `LinkCard`                   | 공통 primitive                    | `src/shared/ui/link-card`; 눌러서 이동하는 목록 카드의 표면과 제목·보조문구·오른쪽 슬롯 배치만 담당한다. 문구 생성과 이동 대상은 사용처가 갖는다.                                                                         |
| `AppDialog`                  | 공통 behavior frame + 도메인 조합 | `src/shared/ui/app-dialog`; focus, backdrop, scroll, 버튼 순서, dismiss 계약을 소유한다.                                                                                                                                  |
| `AppBottomSheet`             | 공통 behavior frame + 도메인 조합 | `src/shared/ui/app-bottom-sheet`; 시트 표면, drag handle, focus, scroll, 스와이프, dismiss 계약만 소유한다. 내용과 버튼 배치는 `_pages/*/ui` 또는 `features/*/ui`의 시트 컴포넌트가 조합한다.                             |
| `AsyncViewState` 계열        | 공통 frame + 도메인 slot          | `src/shared/ui/async-view-state`; Query 객체가 아니라 `status`, 문구, action, pending 값만 받는다. 일러스트는 `status`로 정해진다.                                                                                        |
| `AppToast`                   | 공통 어댑터                       | Sonner를 공통 계약으로 감싸고 Toaster는 `src/_app/providers`에서 한 번 조립한다.                                                                                                                                          |
| `NotificationBell`           | 알림 도메인 컴포넌트              | `src/entities/notification/ui` 또는 규모에 따라 상위 조합; 공통 `AppHeader`, `IconButton`, `Badge`를 사용한다.                                                                                                            |
| `Button`, `IconButton`       | 공통 primitive                    | `src/shared/ui`; 시각 위계, disabled·loading 표현, button semantics만 담당한다.                                                                                                                                           |
| `FooterButton`               | 공통 primitive                    | `src/shared/ui/footer-button`; `AppDialog`와 바텀시트 내용 컴포넌트의 하단 action 버튼에서 `primary \| secondary` 위계와 disabled 표현만 담당한다. 버튼 배치와 문구는 사용처가 갖는다.                                    |
| `SettingsCard`               | 공통 primitive                    | `src/shared/ui/settings-card`; 제목·보조문구·오른쪽 보조 텍스트·chevron의 클릭형 카드 표현만 담당한다.                                                                                                                    |
| `FormField`                  | 공통 primitive                    | `src/shared/ui`; label·hint·error 연결을 담당하고 검증은 도메인에 둔다.                                                                                                                                                   |
| `Badge`                      | 공통 primitive                    | `src/shared/ui/badge`; 읽기 전용 라벨 표현만 소유하고 tone 판정과 문구 생성은 사용처가 갖는다.                                                                                                                            |
| `FilterChip`                 | 공통 primitive                    | `src/shared/ui/filter-chip`; 선택 표현과 44px 터치 영역만 소유하고 무엇을 조회할지는 사용처가 갖는다.                                                                                                                     |
| `AsyncViewState`             | 공통 frame + 도메인 slot          | `src/shared/ui/async-view-state`; SERVICE_COMMON_RULES 4의 상태 골격과 상태별 일러스트를 소유하고 문구·액션은 사용처가 갖는다.                                                                                            |
| `Badge`, `CardSurface`       | 공통 primitive                    | `src/shared/ui`; 도메인 계산과 클릭 결과를 포함하지 않는다.                                                                                                                                                               |
| `ExpirationDateSheet`        | 공통 Feature                      | `src/features/select-expiration-date`; `REG-005`와 `STOCK-002`의 공통 유통기한 선택 UI와 날짜 범위를 소유하고, 폼 연결과 open 상태는 각 Page가 소유한다.                                                                  |
| `IngredientNameInput`        | 공통 Feature 기반                 | `src/features/ingredient-form`; 재료명 입력 표현과 즉시 정제를 소유하고, React Hook Form의 필드 경로·오류 판정과 label·helper 조합은 각 Page가 소유한다.                                                                  |
| `IngredientStorageTypeField` | 공통 Feature 기반                 | `src/features/ingredient-form`; `REG-005`와 `STOCK-002`의 보관 방법 선택 표현과 선택지 순서를 소유하고, React Hook Form의 필드 경로와 컨트롤러 연결은 각 Page가 소유한다.                                                 |
| `IngredientQuantityInput`    | 공통 Feature 기반                 | `src/features/ingredient-form`; `REG-005`와 `STOCK-002`의 수량 입력 표현, 단위 표기, 자릿수 제한과 즉시 정제를 소유하고, React Hook Form의 필드 경로·오류 판정과 label·helper 조합은 각 Page가 소유한다.                  |
| `IngredientWeightInput`      | 공통 Feature 기반                 | `src/features/ingredient-form`; `REG-005`와 `STOCK-002`의 무게 입력 표현, 단위(g·ml) 선택지, 자릿수 제한과 즉시 정제를 소유하고, React Hook Form의 값·단위 필드 경로와 오류 판정, label·helper 조합은 각 Page가 소유한다. |

### `AppShell` 현재 구현

`AppShell`은 보호된 화면에서 Header, 현재 Page, 하단 Navigation을 세로로
조립하는 공통 Widget이다. 소스는 `src/widgets/app-shell`에 두고 Public API인
`@/widgets/app-shell`을 통해 사용한다.

#### 렌더링 트리와 `children`

`AppShell`은 Root Layout에 직접 작성하지 않는다. Root Layout의 `children`으로
선택된 Route Group Layout이 들어오고, `(tabs)` 또는 `(flow)` Layout이
`AppShell`을 렌더링한다.

```text
RootLayout
└─ QueryProvider
   ├─ NavigationHistoryTracker
   └─ div.app-viewport.memo-paper
      └─ TabsLayout 또는 FlowLayout       # RootLayout의 children
         └─ AppShell
            ├─ RouteHeader
            ├─ 현재 Page                  # Route Group Layout의 children
            └─ BottomTabNavigation        # tabs에서만 표시
```

따라서 각 위치에서 같은 이름을 쓰더라도 `children`이 의미하는 값은 다르다.

| 위치                | 해당 위치의 `children`                                      |
| ------------------- | ----------------------------------------------------------- |
| `app/layout.tsx`    | 선택된 Route Group Layout 또는 Layout이 없는 현재 Page 결과 |
| `(tabs)/layout.tsx` | 홈·냉장고·추천·마이 Page                                    |
| `(flow)/layout.tsx` | 알림·재료 등록·재고 상세·재고 수정 Page                     |
| `AppShell`          | Route Group Layout에서 전달받은 현재 Page                   |

로그인과 오프라인 화면은 `(tabs)`, `(flow)` 아래에 있지 않으므로 Root Layout의
`children`으로 직접 렌더링되며 `AppShell`을 사용하지 않는다.

#### 공개 계약

```ts
type AppShellProps = {
  header?: ReactNode;
  children: ReactNode;
  navigation?: ReactNode;
  navigationVisible?: boolean;
};
```

- `header`: 상단에 배치할 Header slot이다.
- `children`: 남은 영역을 사용하는 현재 Page다.
- `navigation`: 하단에 배치할 Navigation slot이다.
- `navigationVisible`: Navigation 렌더 여부이며 기본값은 `true`다.

`AppShell`은 slot의 배치와 콘텐츠 영역 크기만 소유한다. 현재 pathname에 따른
제목·뒤로가기 목적지·활성 탭, 인증, 서버 데이터, 업무별 진입 조건은 판단하지
않는다. 이러한 정책은 Route Group Layout, `RouteHeader`,
`BottomTabNavigation` 또는 해당 도메인에서 소유한다.

#### Route Group별 조립

| Route Group | Header 조립                   | Navigation 조립             | 적용 화면                       |
| ----------- | ----------------------------- | --------------------------- | ------------------------------- |
| `(tabs)`    | `<RouteHeader mode="tabs" />` | `<BottomTabNavigation />`   | 홈, 냉장고, 추천, 마이          |
| `(flow)`    | `<RouteHeader mode="flow" />` | `navigationVisible={false}` | 알림, 재료 등록, 재고 상세·수정 |

`(tabs)`의 등록 버튼이 `/refrigerator/register`로 이동하면 선택되는 Route Group이
`(flow)`로 바뀌므로 같은 `AppShell`을 사용하면서도 하단 Navigation은 사라지고
뒤로가기 Header가 표시된다.

#### 레이아웃과 스크롤 책임

- Root Layout의 `.app-viewport`가 화면 너비를 최대 `--app-max-width`로 제한하고
  메모지 배경을 한 번만 그린다.
- `AppShell` root는 `min-height: 100dvh`인 세로 flex container이며 바깥
  overflow를 숨긴다.
- Header와 Navigation은 축소되지 않는 상·하단 영역이고, 가운데 content가 남은
  높이를 차지한다.
- `AppShell`의 content도 overflow를 숨긴다. 실제 세로 스크롤은 현재 Page의
  최상위 요소가 `min-height: 0`과 `overflow-y: auto`로 소유한다.
- 노치와 홈 인디케이터 safe area는 `AppHeader`와
  `BottomTabNavigation`이 각자 처리한다. `AppShell`이 같은 여백을 다시
  적용하지 않는다.

#### Server/Client 경계

`AppShell`과 두 Route Group Layout은 상태나 브라우저 API를 사용하지 않으므로
Server Component로 유지한다. pathname, router, 클릭 상호작용이 필요한
`RouteHeader`와 `BottomTabNavigation`만 Client Component로 둔다. 이 경계를
유지해 공통 셸 전체가 불필요하게 client bundle에 포함되지 않게 한다.

### 1-5. 네비게이션 방식

> 브라우저 히스토리 스택 — Next.js 16.x App Router 기준

브라우저는 방문한 화면을 스택처럼 쌓아둔다. 뒤로가기는 현재 항목에서 이전
항목으로 이동하는 동작이다.

- `router.push()`는 새 항목을 쌓는다. 뒤로가면 직전 화면으로 돌아간다.
- `router.replace()`는 현재 항목을 덮어쓴다. 스택 길이가 그대로이므로 현재
  화면은 뒤로가기 대상에 남지 않는다.
- `router.back()`은 스택에서 한 칸 이전 항목으로 이동한다. 앱 내부에서
  `push()`로 진입한 흐름에는 적합하지만, 새 탭이나 딥링크로 직접 진입한
  화면에서는 앱 밖으로 나갈 수 있다.

판단 기준은 하나다. **지금 떠나는 화면이 뒤로가기 대상으로 남아야 하는가?**
남아야 하면 `push`, 남으면 안 되면 `replace`를 사용한다. 예를 들어 차감으로
수량이 0이 되어 품목이 삭제됐는데 `push`로 목록에 이동하면, 뒤로가기로 이미
존재하지 않는 상세 화면을 다시 열게 된다.

#### 이동 방식 매트릭스

아래 표는 현재 구현과 v3 목표 흐름을 함께 나타낸다. 아직 화면이 구현되지 않은
REG·차감 흐름은 구현 시 적용할 정책이며, 실제 경로와 상태 계약이 확정되면
`shared/routes` 및 해당 Feature 명세와 함께 갱신한다.

| 이동                            | 방식                                 | 이유                                                                      |
| ------------------------------- | ------------------------------------ | ------------------------------------------------------------------------- |
| 목록 → 상세                     | `push`                               | 뒤로가면 목록으로 돌아와야 한다.                                          |
| 상세 → 수정                     | `push`                               | 뒤로가면 상세로 돌아와야 한다.                                            |
| 수정 저장 성공 → 상세           | safe back, fallback은 해당 상세      | 상세에서 진입했으면 기존 엔트리로 돌아가고 직접 진입이면 상세로 교체한다. |
| 수정 취소 → 상세                | safe back, fallback은 해당 상세      | 저장 성공과 같은 기준으로 앱 밖 이탈을 막는다.                            |
| 상세 헤더 뒤로 → 실제 진입 화면 | safe back, fallback은 냉장고 목록    | 앱 내부 이력이 있으면 실제 진입 화면, 없으면 목록으로 이동한다.           |
| 중복 합산 후 → 대상 품목 상세   | `replace`                            | 편집하던 품목이 병합되어 사라졌으므로 이전 화면에 남기지 않는다.          |
| 차감으로 수량 0 → 목록          | `replace`                            | 삭제된 상세로 되돌아갈 수 없어야 한다.                                    |
| REG-006 계속 등록 → REG-001     | `replace`                            | 완료 화면이 떠 있던 폼으로 되돌아가지 않는다.                             |
| REG-006 냉장고 보기 → 목록      | `replace` + `?sort=created`          | 등록 플로우로 되돌아가지 않고 방금 등록한 재료를 먼저 보여준다.           |
| REG-002 실물 모드 → manual      | `replace`                            | 촬영 화면 복귀로 사진이 중복 부착되는 것을 막는다.                        |
| REG-003 헤더 뒤로 → capture     | `back`                               | capture에서만 진입하므로 스택 한 칸이 정확하다.                           |
| review 진입 시 초안 없음        | `replace(routes.registerIngredient)` | 새로고침으로 결과를 잃었을 때 빈 review 화면을 보여주지 않는다.           |
| 필터·정렬 변경                  | `replace`                            | 칩 조작마다 히스토리가 쌓여 뒤로가기가 필터 이력이 되는 것을 막는다.      |
| 검색어 변경                     | `replace`                            | 타자마다 히스토리가 쌓이지 않게 한다.                                     |
| 시트 열기·닫기                  | `push`·`back`                        | 뒤로가기로 현재 화면을 떠나기 전에 시트만 닫히게 한다.                    |
| 로그인 성공 → 홈                | `replace`                            | 뒤로가기로 로그인 화면이 다시 노출되지 않게 한다.                         |
| 로그아웃 → 로그인               | `replace` + `queryClient.clear()`    | 이전 사용자 화면과 민감 Query cache에 다시 접근하지 못하게 한다.          |

#### `NavigationHistoryTracker`의 책임

`NavigationHistoryTracker`는 조건별 뒤로가기 정책을 직접 결정하지 않는다.
Root Layout에서 pathname, search params, `popstate`를 관찰하고, 현재 브라우저
history entry의 `window.history.state`에 다먹자 앱 내부 이동 깊이를 기록한다.

```text
NavigationHistoryTracker
└─ 앱 내부에서 안전하게 back할 수 있는지 판단할 이력 정보

RouteHeaderPolicy
└─ 직접 진입했을 때 사용할 route별 fallback

Page 또는 Feature
└─ 작성 중 이탈, 삭제·병합, 권한 소멸 같은 업무 조건

뒤로가기 실행 계층
└─ 위 정보를 조합해 back, replace, 확인 Dialog 중 하나를 실행
```

앱 내부 이동은 실행 직전에 `markAppNavigationIntent()`로 `push` 또는
`replace`와 목적지를 기록한다. 선언형 이동은 Next.js의 `Link`를 직접 사용하지
않고 공통 `AppLink`를 사용한다. `AppLink`는 실제 SPA 이동에만 실행되는
`onNavigate`에서 `replace` prop을 기준으로 intent를 자동 기록한다. 프로그램
방식 이동은 `router.push()` 또는 `router.replace()` 직전에 intent를 기록한다.
Tracker는 도착한 pathname과 search params가 intent의 목적지와 일치할 때만
intent를 소비한다.

```tsx
// 새 history entry를 쌓는다. push intent는 AppLink가 기록한다.
<AppLink href={routes.refrigerator}>냉장고</AppLink>

// 현재 entry를 교체한다. replace intent는 AppLink가 기록한다.
<AppLink href={routes.home} replace>
  홈
</AppLink>
```

`onClick`은 새 탭 열기와 다운로드를 포함한 모든 클릭에서 실행될 수 있으므로
intent 기록에 사용하지 않는다. `AppLink`가 사용하는 `onNavigate`는 같은 origin의
실제 Next.js SPA 이동에서만 실행된다. 외부 URL, 다운로드, 새 탭 링크에는
`AppLink`를 사용하지 않는다.

| 이동 종류                  | depth 처리                                      |
| -------------------------- | ----------------------------------------------- |
| 최초 진입                  | 저장값이 없으면 `0`을 기록한다.                 |
| intent가 `push`            | 현재 depth에 `1`을 더해 새 entry에 기록한다.    |
| intent가 `replace`         | 현재 depth를 증가시키지 않고 그대로 기록한다.   |
| `popstate`                 | 도착한 history entry에 저장된 depth를 복원한다. |
| intent가 없는 예상 밖 이동 | 안전하게 `0`으로 초기화한다.                    |

현재 `RouteHeader`는 앱 내부 이동 깊이가 1 이상이면 `router.back()`을 실행한다.
그렇지 않으면 `replace` intent를 먼저 기록하고 route별 `backFallbackHref`로
`router.replace()`한다. 따라서 수정 URL에 직접 진입한 뒤
`수정 → 상세 → 냉장고 목록`으로 연속 fallback해도 실제로 존재하지 않는 앱 내부
history를 만들지 않는다.

향후 `REG-007` 작성 중 이탈처럼 조건부 확인이 필요해져도 업무 조건을 Tracker에
추가하지 않는다. Page 또는 Feature가 이탈 가능 여부를 판단하고 공통
뒤로가기 실행 계층에는 계산된 결과나 callback만 제공한다.

현재 구현에는 다음 제한이 있다.

- 이전 URL 전체나 알림·푸시 같은 업무상 진입 출처는 별도로 저장하지 않는다.
- hash만 바뀌거나 URL이 바뀌지 않는 history state 이동은 추적 대상이 아니다.
  뒤로가기로 닫아야 하는 시트는 식별 가능한 search param을 사용한다.
- 새 앱 내부 선언형 링크는 반드시 `AppLink`를 사용한다. `next/link`를 직접
  import해서 intent 기록을 반복하지 않는다.
- 새 `router.push()`, `router.replace()` 사용처는 반드시 intent를 함께 기록해야
  한다. 빠뜨린 예상 밖 이동은 앱 밖 이탈을 막기 위해 depth `0`으로 초기화된다.

업무별 조건은 Tracker의 route 조건문으로 추가하지 않고, 공통 이동 API 또는
뒤로가기 controller 계약으로 확장하고 테스트한다.

#### 주의 사항 1: 딥링크로 진입하면 앱 내부 스택이 비어 있다

Serwist 푸시의 `notificationclick`이 새 탭을 열어 재고 상세 URL로 직접
진입하면, 이전 history entry가 다먹자 화면이라는 보장이 없다. 이때
`window.history.length > 1`만 확인하면 외부 사이트의 history까지 앱 내부
이력으로 오인할 수 있다. Tracker가 현재 entry에 기록한 앱 전용 depth와
명시적인 navigation intent를 함께 사용해야 한다.

```tsx
const navigateBack = () => {
  if ((readAppNavigationDepth() ?? 0) > 0) {
    router.back();
    return;
  }

  markAppNavigationIntent("replace", routes.refrigerator);
  router.replace(routes.refrigerator);
};
```

fallback은 모든 화면에서 냉장고 목록으로 고정하지 않는다. 알림은 홈, 수정은
해당 상세처럼 `RouteHeaderPolicy`가 현재 route에 맞는 목적지를 제공한다.

#### 주의 사항 2: 서버 상태 갱신에 `router.refresh()`를 사용하지 않는다

`router.refresh()`는 현재 URL의 Server Component 결과를 다시 요청하는
기능이다. TanStack Query가 소유한 재고 목록·상세·용량 cache를 무효화하는
기능이 아니다.

- 현재 데이터 화면의 서버 상태는 TanStack Query가 소유하므로
  `router.refresh()`만 호출해도 Query cache는 갱신되지 않는다.
- 나중에 홈 일부를 서버에서 prefetch하더라도 서버 결과와 브라우저 Query
  cache를 서로 다른 갱신 경로로 취급하면 한 화면의 수치가 일시적으로 어긋날
  수 있다.

예를 들어 홈에서 달걀을 만료 처리했다고 가정한다.

```text
홈에서 달걀을 만료 처리했다
├─ router.refresh()만 호출
│  ├─ 서버에서 그린 용량 카드는 새 값
│  └─ Query cache가 그린 재료 목록은 이전 값일 수 있음
└─ 영향받는 Query Key를 invalidate
   └─ 용량과 목록을 같은 서버 상태 갱신 정책으로 동기화
```

등록·수정·차감 후에는 mutation이 영향을 주는 Query Key를 명시하고
`queryClient.invalidateQueries()` 또는 서버 응답을 이용해 동기화한다.
`router.refresh()`를 TanStack Query 무효화의 대체물로 사용하지 않는다. 자세한
캐시 소유권은 [FSD 아키텍처 규칙](./FSD_ARCHITECTURE.md)의 “Next.js 캐시와
Query 캐시” 절을 따른다.

### Dialog와 Bottom Sheet 사용 원칙

- `AppDialog`와 `AppBottomSheet`는 껍데기와 상호작용 규칙만 제공한다.
- 작성 중 이탈, 삭제 확인, 중복 재료 합산, 부분 성공, 재료 차감 같은 조합은
  해당 `features/*/ui` 또는 `_pages/*/ui`가 소유한다.
- 중요한 선택이나 되돌릴 수 없는 작업은 Toast로 대체하지 않는다.
- dismiss 정책은 자유로운 boolean 조합 대신 합의된 제한된 값으로 제공한다.
- 업무별 Dialog가 여러 단계의 시퀀스라면 공통 variant로 숨기지 않고 도메인
  컴포넌트가 단계를 관리한다.

#### `AppDialog` v1 공개 계약

구현과 Tailwind 스타일은 `src/shared/ui/app-dialog/app-dialog.tsx`, Public API는
`index.ts`에 둔다.

- 구조는 `title`, `description`, `secondaryAction`, `primaryAction`으로 고정한다.
- 버튼은 화면설계서처럼 `[보조 행동][주 행동]` 순서로 표시한다.
- `secondaryAction`을 생략하면 주 행동 하나만 표시하는 단일 버튼 모달이 된다.
  선택지가 없는 안내에만 쓰고, 되돌릴 수 없는 처리에는 쓰지 않는다.
- 버튼 문구와 실행 결과, pending에 따른 `disabled` 값은 사용하는 Feature나
  Page가 결정한다.
- 바깥 영역 클릭과 ESC는 기본적으로 `secondaryAction`과 같은 의미다. 단일 버튼
  모달에서는 주 행동이 닫기를 겸한다. 중요한
  처리 중 닫기를 막아야 하면 `dismissBehavior="none"`을 사용한다.
- native `dialog`가 focus trap과 뒤쪽 콘텐츠 비활성화를 담당하고,
  `AppDialog`는 열림 중 문서 scroll lock과 닫힌 뒤 focus 복구를 담당한다.

```tsx
import { AppDialog } from "@/shared/ui/app-dialog";

<AppDialog
  open={isOpen}
  title="재료를 등록할까요?"
  description="신규 재료가 냉장고에 추가돼요."
  secondaryAction={{ label: "취소", onClick: closeDialog }}
  primaryAction={{ label: "등록", onClick: registerIngredient }}
/>;
```

#### `AppBottomSheet` v1 공개 계약

구현은 `src/shared/ui/app-bottom-sheet/app-bottom-sheet.tsx`, Public API는
`index.ts`에 둔다. Base UI(`@base-ui/react`)의 Drawer를 감싸며, 다른 레이어는
Base UI를 직접 import하지 않고 이 Public API만 사용한다.

- `AppBottomSheet`는 `open`, `onDismiss`, `dismissBehavior`, `children`만 받는다.
  제목·설명·본문·버튼은 `children`으로 사용처가 조합한다.
- 시트 표면, drag handle, backdrop, 등장·퇴장과 스와이프 애니메이션, 앱 최대
  너비와 하단 safe area 처리를 소유한다.
- 바깥 탭, ESC, 아래로 스와이프는 모두 `onDismiss` 하나로 전달한다. 사용처는
  이를 취소와 같은 의미로 처리한다.
- 처리 중 닫기를 막아야 하면 `dismissBehavior="none"`을 사용한다. 이때 닫기
  동작은 취소되고 시트는 제자리로 돌아간다.
- 제목과 설명은 `AppBottomSheetTitle`, `AppBottomSheetDescription`으로 감싸
  시트의 접근 가능한 이름·설명에 연결한다. 두 컴포넌트는 스타일을 갖지 않으며
  `className`은 사용처가 정한다.
- focus trap, 뒤쪽 콘텐츠와 하단 navigation 조작 차단, 문서 scroll lock, 닫힌 뒤
  focus 복구는 Base UI가 담당한다. 열릴 때 첫 번째 focus 대상은 시트 안의 첫
  번째 버튼이므로 버튼은 `[보조 행동][주 행동]` 순서로 배치한다.
- 하단 버튼은 `FooterButton`을 사용하고, 버튼 줄의 배치는 시트 내용 컴포넌트가
  정한다.

```tsx
import {
  AppBottomSheet,
  AppBottomSheetDescription,
  AppBottomSheetTitle,
} from "@/shared/ui/app-bottom-sheet";
import { FooterButton } from "@/shared/ui/footer-button";

<AppBottomSheet open={open} onDismiss={onCancel}>
  <AppBottomSheetTitle className="...">
    만료 재료 3종을 정리할까요?
  </AppBottomSheetTitle>
  <AppBottomSheetDescription className="...">
    정리한 재료는 되돌릴 수 없어요.
  </AppBottomSheetDescription>
  <div className="mt-[18px] flex gap-[10px]">
    <FooterButton variant="secondary" onClick={onCancel}>
      취소
    </FooterButton>
    <FooterButton onClick={onConfirm}>정리하기</FooterButton>
  </div>
</AppBottomSheet>;
```

### Toast 사용 원칙

- 화면 하단에서 3초 동안 표시한다.
- 동시에 한 개만 표시한다.
- 같은 `dedupeKey`의 Toast가 반복되면 새로 쌓지 않고 timer를 갱신한다.
- 공통 계약은 `message`, `variant`, `dedupeKey`, 선택적 `action`(label, onClick)으로 제한한다.
- 메시지형과 action형 모두 같은 표시·중복·자동 닫힘 규칙을 사용한다.
- 표시 시점과 메시지, action의 실행 내용은 호출 도메인이 결정한다.
- action 버튼을 누르면 해당 Toast를 닫고 호출 도메인의 `onClick`을 실행한다.

```tsx
import { showAppToast } from "@/shared/ui/app-toast";

showAppToast({ message: "재료를 저장했어요", variant: "success" });
showAppToast({
  message: "연결에 실패했어요",
  variant: "error",
  dedupeKey: "retry-save",
  action: { label: "다시 시도", onClick: retrySave },
});
```

### 비동기 상태 UI 사용 원칙

- `LoadingState`, `EmptyState`, `ErrorState`, `RetryButton`,
  `PaginationState`의 공통 배치와 접근성을 제공할 수 있다.
- Query 성공 여부나 빈 배열의 의미는 사용하는 도메인이 판단한다.
- 빈 상태 문구와 복구 action은 화면별 명세가 소유한다. 일러스트는 상태별로
  공용 컴포넌트가 고정한다.
- `useQuery` 반환 객체 전체를 넘기지 않고 화면 표시용 값으로 변환한다.

### Chip 계열 사용 원칙

Chip 모양을 가진 컴포넌트는 하나로 묶지 않고 **사용자 조작 가능 여부와 사용
목적**으로 나눈다. 모양이 같다는 이유로 합치면 읽기 전용 라벨에 클릭 계약이
새는 것을 막을 수 없다.

| 컴포넌트     | 사용자 조작 | 사용 목적                     | 예시                         | 구현 위치                   |
| ------------ | ----------- | ----------------------------- | ---------------------------- | --------------------------- |
| `Badge`      | 불가        | 정보를 읽기 전용으로 표시     | 냉장·냉동, 만료·임박·여유    | `src/shared/ui/badge`       |
| `FilterChip` | 가능        | 목록 필터 또는 수량 조건 선택 | 전체·냉장·냉동, 1개·5개·전체 | `src/shared/ui/filter-chip` |
| `ActionChip` | 가능        | 버튼 세트 중 하나를 선택      | 등록·수정 폼의 카테고리 선택 | 사용처가 생길 때 구현한다   |

- 세 컴포넌트 모두 tone 판정, 문구 생성, 날짜 계산, 조회 조건 결정을 내부에
  두지 않는다. 사용처가 결과만 내려준다.
- `ActionChip`은 아직 사용하는 화면이 없으므로 만들지 않는다. 등록·수정 폼에서
  카테고리 선택이 구현될 때 같은 원칙으로 추가한다.

#### `Badge` v1 공개 계약

구현은 `src/shared/ui/badge/badge.tsx`, Public API는 같은 디렉터리의
`index.ts`에 둔다. 상태를 갖지 않으므로 Server Component로 렌더링한다.

- Props는 `children`, `tone`, `size`, `className`으로 제한한다.
- `tone`은 `solid`, `muted`, `outline`, `primary`, `highlight`만 허용하고
  기본값은 `muted`다.
- `size`는 `sm`(11px 라벨)과 `md`를 허용한다. `md`는
  [서비스 공용 규칙 2.2](./SERVICE_COMMON_RULES.md)의 상태 뱃지 규격인
  `51 × 30`, radius `9999`, `12px Bold`다.
- 어떤 tone과 size를 쓸지는 사용처가 정하고 `Badge`는 도메인을 모른다.

```tsx
import { Badge } from "@/shared/ui/badge";

<Badge tone="primary" className="shrink-0">
  하루 1회
</Badge>;
```

#### `FilterChip` v1 공개 계약

구현은 `src/shared/ui/filter-chip/filter-chip.tsx`에 둔다. `onClick`을 받으므로
Client Component 트리 안에서만 사용한다.

- Props는 `children`, `selected`, `tone`, `disabled`, `onClick`, `className`으로
  제한한다. 개수와 해제 표시(`✕`)는 칩에 붙이지 않는다.
- 선택 표현은 `채움 + 흰 글자`, 미선택은 `테두리`로 고정한다.
- `tone`은 선택 상태의 채움 색이며 `ink`와 `primary`만 허용한다. 어떤 조건에
  어떤 tone을 쓸지는 사용처가 정하고 칩은 도메인을 모른다.
- 버튼이 `44 × 44` 터치 영역을 유지하고 안쪽 `span`이 칩 모양을 그린다.
- 단일 선택인지 다중 선택인지, 어떤 조회가 나가는지는 사용처가 결정한다.

```tsx
import { FilterChip } from "@/shared/ui/filter-chip";

<FilterChip
  selected={filter === "EXPIRED"}
  onClick={() => onFilterChange(filter === "EXPIRED" ? null : "EXPIRED")}
>
  만료
</FilterChip>;
```

## 10. 보류 중인 결정

다음 항목은 구현 전에 제품·디자인·백엔드 계약과 함께 확정해야 한다.

- 현재 냉장고 ID의 원본과 지속 위치: API의 `activeRefrigeratorId`, URL, 쿠키,
  서버 세션 중 우선순위와 새로고침 후 유지 범위
- `CurrentFridgeContext`의 공개 read contract와 FSD import 방향을 모두 만족하는
  소유 위치
- 최신 v3 `BottomTabBar`의 탭 구성과 탭 외 화면의 활성 탭 판정
- Dialog·BottomSheet의 바깥 클릭, ESC, 뒤로가기, 스와이프 허용 기준
- OCR·추천·일반 조회 오류를 Toast, 화면 내부 ErrorState, Dialog,
  BottomSheet 중 어디에 표시할지에 대한 기준
- `REG-005`와 `STOCK-002` 유통기한 입력의 기본값, 허용 범위, 미입력 허용,
  Asia/Seoul 시간대 계약 일치 여부
- 푸시 알림 진입 시 활성 탭, 뒤로가기 목적지, 세션 만료·냉장고 접근 불가 시
  이동 정책

냉장고 전환 시 검색·필터·정렬, 스크롤, 열린 overlay, 작성 중인 폼을 포함한
기존 화면 상태는 **전체 초기화**하는 것으로 확정한다.

보류 항목은 임의의 prop이나 전역 상태로 먼저 구현하지 않는다. 현재 필요한
사용처 안에 유지하고 계약이 확정된 뒤 이 문서와 함께 갱신한다.

## 11. 구현·리뷰 체크리스트

- [ ] 실제 화면에서 구조와 동작이 반복된 근거가 있는가?
- [ ] 공통 컴포넌트가 결정하는 것과 도메인에 남기는 것을 설명할 수 있는가?
- [ ] `shared`의 이름과 Props에 도메인 용어가 들어가지 않았는가?
- [ ] API DTO, Query 객체, mutation, 라우팅 정책을 공통 UI가 알지 않는가?
- [ ] 유한한 차이는 variant로, 사용처 소유 영역은 이름 있는 slot으로
      표현했는가?
- [ ] boolean prop과 slot이 사용처마다 계속 증가하고 있지 않은가?
- [ ] 상태별 단일 원천이 유지되는가?
- [ ] Server Component를 기본으로 두고 Client 경계를 최소화했는가?
- [ ] focus, keyboard, scroll lock, listener의 cleanup을 검증했는가?
- [ ] 로딩 중 중복 실행을 막고 disabled 상태를 접근 가능하게 표현했는가?
- [ ] FSD 레이어 방향과 Public API import 규칙을 지켰는가?
- [ ] 미래 사용 예상만으로 디렉터리나 추상화를 미리 만들지 않았는가?
- [ ] 화면별 예외가 늘었다면 공통화를 되돌리는 선택도 검토했는가?
- [ ] 보류된 제품 정책을 코드에서 임의로 확정하지 않았는가?

## 12. 참고 자료

- [공통 도메인 테크 스펙 위키](https://github.com/100-hours-a-week/KTB4-5th-wiki/wiki/%5BFE%5D-%EA%B3%B5%ED%86%B5-%EB%8F%84%EB%A9%94%EC%9D%B8-%ED%85%8C%ED%81%AC-%EC%8A%A4%ED%8E%99)
- [저장소: FSD 아키텍처 규칙](./FSD_ARCHITECTURE.md)
- [카카오페이 기술 블로그: 공통 컴포넌트를 건강하게 기르기 위한 고민](https://tech.kakaopay.com/post/kakaopayins-fe-common-component/)
