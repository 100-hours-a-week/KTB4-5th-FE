# FE Sentry 배포 설정

Sentry 조직은 `kakaotechbootcamp`, FE 프로젝트는 `dameokja-fe`다.
브라우저·Next.js Node/Edge 오류와 성능 추적을 `@sentry/nextjs`로 수집한다.
개발 환경 추적은 100%, `production`은 10%이며 오류는 기본 100% 수집한다.
사용자 정보, 쿠키, HTTP 헤더·본문, URL 쿼리, 스택 로컬 변수 자동 수집은 끈다.
Session Replay와 프로파일링은 이번 설정에 포함하지 않는다.

## 배포 담당자가 등록할 값

FE GitHub 저장소의 **Settings → Secrets and variables → Actions**에 등록한다.

| 종류                | 이름                | 값 / 용도                                                                                         |
| ------------------- | ------------------- | ------------------------------------------------------------------------------------------------- |
| Repository Variable | `SENTRY_DSN`        | `https://8e2d0af87081f800c6f3dabbe84ec368@o4512162336276480.ingest.us.sentry.io/4512163587555328` |
| Repository Secret   | `SENTRY_AUTH_TOKEN` | `kakaotechbootcamp/dameokja-fe` 소스맵·release 업로드 권한이 있는 Sentry 토큰                     |

DSN은 브라우저에 공개되는 오류 수집 주소다. **BE DSN을 사용하지 않는다.**
토큰 값은 코드·PR·Docker build argument에 넣지 않는다.
토큰이 없으면 소스맵 업로드만 생략하고 빌드는 가능하지만,
실제 오류의 원본 TypeScript 위치를 확인하려면 토큰을 등록해야 한다.
기존 BE 업로드 토큰을 사용하려면 같은 조직에서 FE 프로젝트 업로드 권한이 있는지 확인한다.

## CI가 자동으로 전달하는 환경변수

| 이미지 내 변수                   | 전달 시점      | 값                                        |
| -------------------------------- | -------------- | ----------------------------------------- |
| `NEXT_PUBLIC_SENTRY_DSN`         | 빌드·서버 실행 | 위 `SENTRY_DSN` 값                        |
| `NEXT_PUBLIC_SENTRY_ENVIRONMENT` | 빌드·서버 실행 | `dev` 브랜치: `dev`, `main`: `production` |
| `NEXT_PUBLIC_SENTRY_RELEASE`     | 빌드·서버 실행 | 빌드한 Git commit SHA                     |
| `SENTRY_AUTH_TOKEN`              | 빌드 명령만    | BuildKit secret, 실행 이미지에는 없음     |

환경과 release는 워크플로가 정하므로 별도 Repository Variable 등록은 필요 없다.
FE 서버의 `APP_ENV`나 Compose 설정 추가도 필요 없다.
공개 변수는 브라우저 번들에 고정되므로 DSN·환경을 바꾸면 이미지를 다시 빌드한다.
PR 검증은 DSN·업로드 토큰을 전달하지 않아서 Sentry 오류 전송과 업로드를 하지 않는다.

## 로컬 실행 / 직접 Docker 빌드

`.env.local`에 다음 공개 설정을 넣는다. 파일은 Git에서 제외된다.

```dotenv
NEXT_PUBLIC_SENTRY_DSN=https://8e2d0af87081f800c6f3dabbe84ec368@o4512162336276480.ingest.us.sentry.io/4512163587555328
NEXT_PUBLIC_SENTRY_ENVIRONMENT=local
NEXT_PUBLIC_SENTRY_RELEASE=local
```

DSN을 설정하지 않으면 전송을 하지 않는다. 로컬 오류가 `dev`·운영과 섞이지 않게 `local`을 사용한다.
직접 이미지 빌드 시 세 공개 변수를 각각 `--build-arg`로 전달한다.
소스맵 업로드가 필요하면 토큰을 셸 환경에 두고
`--secret id=SENTRY_AUTH_TOKEN,env=SENTRY_AUTH_TOKEN`으로 전달한다.

## 배포 후 확인

1. 위 Repository Variable과 Secret을 등록한 뒤 이 변경을 배포한다.
2. 빌드 로그에서 소스맵 업로드가 성공했는지 확인한다.
3. 개발 배포에서 통제된 브라우저 오류를 발생시켜 `dameokja-fe` Issues에
   환경 `dev`와 배포 commit SHA가 기록되는지 확인한다.
4. 스택 프레임이 원본 TypeScript 파일·줄 번호로 보이는지 확인한다.
5. 높은 우선순위 이슈가 발생하면 Discord `#fe-알리미`로 알림이 오는지 확인한다.

Discord는 Sentry의 기존 조직 연동과
[FE 알림 규칙](https://kakaotechbootcamp.sentry.io/monitors/alerts/6078308/)에서 관리한다.
채널 ID는 `1552264768134582322`이며 기존 이메일 알림도 유지한다.
FE 서버에 Discord webhook 환경변수를 추가할 필요는 없다.
Sentry의 테스트 알림을 해당 채널에서 수신한 것은 확인했다.
로컬 검증 사본에서 발생시킨 브라우저·서버 오류도 Sentry와 Discord에 수신했고,
환경·release가 함께 표시되는 것을 확인했다. 임시 검증 경로는 저장소에 포함하지 않는다.
실제 배포 앱의 오류 수집·소스맵 업로드는 배포 후 별도로 확인해야 한다.

## 서비스 오류 수집 정책

재고 목록·상세 조회, 재고 등록, 알림 목록·배지·설정 조회와 읽음 처리,
알림 푸시 구독·해제와 로그인 후 자동 재구독의 최종 실패를 수집한다. TanStack
Query의 공통 캐시 콜백에서 재시도 종료 후 한 번 보고하며, 브라우저 푸시 구독의
단계별 실패 결과도 같은 경로로 보낸다. 자동 재구독 실패는 로그인 화면에 오류를
표시하지 않는다.

- 일반 API 4xx, 세션 만료, 취소된 요청은 보고하지 않는다. 푸시 구독에서
  재시도 후에도 남은 4xx는 기기 구독 불일치 진단을 위해 보고한다.
- `feature`, `operation`, `failure_type`, HTTP 상태, 검증된 서비스 오류 코드와
  푸시 실패 단계(`key`·`subscribe`·`register`)를 태그로 사용한다.
- 수동 보고 컨텍스트의 요청 경로는 실제 사용자·냉장고·재고 ID를 제거한 고정
  경로로 남긴다. API 응답의 `detail`, 요청 본문, 푸시 endpoint와 구독 키는
  추가하지 않는다.
- 수동 보고 이벤트에는 안전한 고정 문구로 만든 예외를 사용한다. 따라서 이
  이벤트의 스택은 보고 함수 위치를 가리키며, 원인 분석에는 태그·컨텍스트와
  해당 release의 다른 오류·성능 추적을 함께 사용한다.
- 알림 규칙은 실제 발생량을 확인한 뒤 `production`의 새로운 이슈와 반복되는
  재고 등록·푸시 구독 실패를 구분해 설정한다.

## 참고

- [Sentry Next.js 공식 설정](https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/)
- [Next.js 환경변수](https://nextjs.org/docs/app/guides/environment-variables)
