import { siteConfig } from "@/shared/config";

export const PUSH_INSTALL_GUIDE_TITLE = "홈 화면에 추가해 주세요";

export const PUSH_INSTALL_GUIDE_DESCRIPTION =
  "iOS에서는 홈 화면에 추가한 앱에서만 푸시 알림을 받을 수 있어요.";

export const PUSH_INSTALL_GUIDE_STEPS = [
  "Safari 하단의 공유 버튼을 눌러 주세요",
  "'홈 화면에 추가'를 선택해 주세요",
  `홈 화면에 생긴 ${siteConfig.name} 앱으로 다시 열어 주세요`,
] as const;
