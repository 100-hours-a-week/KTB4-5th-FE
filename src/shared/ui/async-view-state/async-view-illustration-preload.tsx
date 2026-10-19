import { preload } from "react-dom";

import { asyncViewIllustrations } from "./async-view-illustrations";

/**
 * 상태 일러스트는 로딩·오류가 화면에 붙은 뒤에야 요청되면 이미 늦는다.
 * 첫 HTML의 <head>에 같은 URL로 preload를 걸어 브라우저 캐시에 미리 둔다.
 */
export function AsyncViewIllustrationPreload() {
  for (const image of Object.values(asyncViewIllustrations)) {
    preload(image.src, {
      as: "image",
      fetchPriority: "low",
    });
  }

  return null;
}
