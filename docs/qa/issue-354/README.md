# 로그인 지연 대응 모의 응답 검증

- 프론트엔드 QA: https://github.com/100-hours-a-week/KTB4-5th-FE/issues/354
- 원본 제보: https://github.com/100-hours-a-week/KTB4-5th-wiki/issues/234
- Chrome 로컬 모의 응답, 실제 시간으로 녹화한 약 68초 영상입니다.
- 계정과 토큰은 가짜 값이며, 외부 카카오 인증은 실행하지 않았습니다.

[전체 녹화](./login-recovery.mp4)

| 화면 | 검증 내용 |
| --- | --- |
| [CSRF 시간 초과](./csrf-timeout.png) | 5초 후 오류 화면·재시도 |
| [세션 갱신 시간 초과](./session-timeout.png) | 전체 15초 후 오류 화면·재시도 |
| [재시도 성공](./retry-success.png) | 정상 응답 복구 후 홈 진입 |
| [카카오 준비 시간 초과](./oauth-preparation-timeout.png) | 5초 후 버튼 복구, 늦은 완료의 자동 이동 방지 |

영상에는 일반 API 401 후 갱신 503에서도 로그인 화면으로 이동하지 않고 재시도하는 흐름을 포함합니다.
원래 PWA 지연·자동 OAuth의 원인은 미확정이며, 실제 설치 PWA와 Sentry 수신은 배포 후 확인해야 합니다.
