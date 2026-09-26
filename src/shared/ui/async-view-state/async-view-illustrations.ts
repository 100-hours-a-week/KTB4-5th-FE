import type { StaticImageData } from "next/image";

import emptyIllustration from "@/shared/assets/illustrations/illustration-empty.webp";
import errorIllustration from "@/shared/assets/illustrations/illustration-error.webp";
import loadingIllustration from "@/shared/assets/illustrations/illustration-loading.webp";

export type AsyncViewStatus = "loading" | "error" | "empty";

export const ASYNC_VIEW_ILLUSTRATION_SIZES = "160px";

export const asyncViewIllustrations: Record<AsyncViewStatus, StaticImageData> =
  {
    loading: loadingIllustration,
    error: errorIllustration,
    empty: emptyIllustration,
  };
