import { setupWorker } from "msw/browser";

import { isMswFullEnabled } from "./enabled";
import { createFullHandlers } from "./full/handlers";
import { handlers } from "./handlers";
import { createRecommendationHandlers } from "./recommendation/handlers";

export const worker = setupWorker(
  ...(isMswFullEnabled()
    ? [
        ...createFullHandlers(),
        ...createRecommendationHandlers({ mockAll: true }),
      ]
    : []),
  ...handlers,
);
