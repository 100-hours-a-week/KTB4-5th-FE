import { JetBrains_Mono } from "next/font/google";

// 본문·제목·숫자 표기에 공통으로 쓰는 폰트.
// globals.css의 --font-mono가 이 CSS 변수를 참조한다.
export const jetBrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-jetbrains-mono",
});
