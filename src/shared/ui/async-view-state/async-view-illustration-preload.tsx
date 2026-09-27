import { getImageProps } from "next/image";
import { preload } from "react-dom";

import {
  ASYNC_VIEW_ILLUSTRATION_SIZES,
  asyncViewIllustrations,
} from "./async-view-illustrations";

/**
 * 상태 일러스트는 로딩·오류가 화면에 붙은 뒤에야 요청되면 이미 늦는다.
 * 첫 HTML의 <head>에 같은 srcset으로 preload를 걸어 브라우저 캐시에 미리 둔다.
 */
export function AsyncViewIllustrationPreload() {
  for (const src of Object.values(asyncViewIllustrations)) {
    const { props } = getImageProps({
      src,
      alt: "",
      sizes: ASYNC_VIEW_ILLUSTRATION_SIZES,
    });

    preload(props.src, {
      as: "image",
      imageSrcSet: props.srcSet,
      imageSizes: props.sizes,
      fetchPriority: "low",
    });
  }

  return null;
}
