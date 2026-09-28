import { siteConfig } from "@/shared/config";

export const PUSH_PERMISSION_GUIDE_TITLE = "알림을 다시 켜 주세요";

export const PUSH_PERMISSION_GUIDE_DESCRIPTION =
  "홈 화면 앱을 삭제하지 않아도 iPhone 설정에서 알림을 다시 허용할 수 있어요.";

export const PUSH_PERMISSION_SETTINGS_PATH =
  `설정 > 앱 > ${siteConfig.manifestName} > 알림`;

export const PUSH_PERMISSION_GUIDE_STEPS = [
  "iPhone의 '설정' 앱을 열어 주세요",
  `'앱' > '${siteConfig.manifestName}' > '알림'을 선택해 주세요`,
  "'알림 허용'을 켜 주세요",
  `홈 화면의 ${siteConfig.name} 앱으로 돌아와 PUSH 알림을 다시 눌러 주세요`,
] as const;
