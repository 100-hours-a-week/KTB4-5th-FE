# v1 CI/CD

## Node.js 보안 업데이트

개발 환경은 `.nvmrc`의 Node.js 24.22.1을 사용한다(`nvm install && nvm use`).
Docker의 빌드·실행 이미지도 `node:24.22.1-bookworm-slim`으로 고정한다.
패키지와 lockfile 업데이트는 Node.js 런타임 업데이트와 별개다.

런타임 변경 후 테스트·린트·타입 검사·빌드를 수행하고 새 이미지를 빌드한다.
Docker 빌드 로그의 `node --version` 출력과 최종 이미지에서 실행한
`node --version`이 모두 `v24.22.1`인지 확인한다.
dev·stage 검증 후 기존 승인 절차로 동일한 이미지 digest를 운영에 배포하고,
실행 중인 모든 ECS 태스크에서 이미지 digest와 컨테이너 내부 `node --version`을
확인한다. 기존 이미지의 재시작만으로는 Node.js가 업데이트되지 않는다.

## 기존 v1 안내

`.github/workflows/v1-cicd.yml`은 dev/main 대상 PR을 검증하고, dev/main 푸시 시 ARM64 이미지를 GHCR에 게시한다. dev 푸시는 항상 자동 배포하고, main 푸시는 Repository Variable `CD_ENABLED=true`일 때만 운영 배포한다. GitHub Environments 없이 dev/main은 서로 다른 `DEPLOY_HOST`와 `SSH_KNOWN_HOSTS`만 선택하고 나머지는 공통 설정을 사용한다.

환경별 설정·서버 준비·롤백 절차는 [CLOUD 저장소의 실행 안내](https://github.com/100-hours-a-week/KTB4-5th-CLOUD/blob/main/docs/v1-cicd-setup.md)를 따른다. 해당 CLOUD 변경을 서버에 먼저 반영해야 한다.

FE 서버에는 배포 시 별도로 주입할 비밀 환경변수가 없으므로 `APP_ENV` Secret을 등록하지 않는다. 브라우저에 포함되는 공개 API 주소는 Repository Variable `DEV_API_BASE_URL`, `PROD_API_BASE_URL`로 관리하며 이미지 빌드 시 주입한다.

Sentry는 Repository Variable `SENTRY_DSN`과 소스맵 업로드용 Repository Secret `SENTRY_AUTH_TOKEN`을 사용한다. 공개 DSN·환경·release는 이미지 빌드 시 전달하고 서버 실행 이미지에도 같은 값을 저장한다. 업로드 토큰은 BuildKit secret으로 빌드 명령에만 전달하며 이미지와 서버 실행 환경에는 저장하지 않는다. 등록할 값과 배포 확인 절차는 [Sentry 배포 설정](sentry.md)을 따른다.

비공개 GHCR 이미지는 배포 Job의 단기 `GITHUB_TOKEN`으로 인증해 내려받으며, 별도의 PAT을 등록하지 않는다.

현재 변경은 로컬 구현이며 실제 CI 실행과 서버 배포 검증은 아직 수행하지 않았다.
