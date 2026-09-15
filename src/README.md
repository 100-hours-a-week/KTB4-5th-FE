# v1 FSD 스캐폴드

현재 스캐폴드는 다먹자 v1 범위만 대상으로 한다.

| 화면 ID     | 경로                          | FSD Page slice               |
| ----------- | ----------------------------- | ---------------------------- |
| `AUTH-001`  | `/login`                      | `_pages/login`               |
| `MAIN-001`  | `/`                           | `_pages/home`                |
| `REG-004`   | `/ingredients/register`       | `_pages/register-ingredient` |
| `STOCK-001` | `/refrigerator`               | `_pages/refrigerator`        |
| `STOCK-002` | `/ingredients/[ingredientId]` | `_pages/ingredient-detail`   |
| `NOTI-001`  | `/notifications`              | `_pages/notifications`       |

v1의 로그아웃은 화면이 아니라 이후 `features/logout`으로 구현할 사용자 행위다.
OAuth, OCR, 마이페이지 설정, 냉장고 공유, AI 추천과 재료 차감은 v2 또는 v3
범위이므로 이 스캐폴드에 포함하지 않는다.

레이어와 import 규칙은 [`../docs/FSD_ARCHITECTURE.md`](../docs/FSD_ARCHITECTURE.md)를
따른다.
