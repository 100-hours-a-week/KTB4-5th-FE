import { createSerwistRoute } from "@serwist/turbopack";
import { randomUUID } from "node:crypto";
import { spawnSync } from "node:child_process";

import { routes } from "@/shared/routes";

const gitRevision = spawnSync("git", ["rev-parse", "HEAD"], {
  encoding: "utf8",
}).stdout.trim();

const revision = gitRevision || randomUUID();

export const { dynamic, dynamicParams, revalidate, generateStaticParams, GET } =
  createSerwistRoute({
    additionalPrecacheEntries: [{ url: routes.offline, revision }],
    swSrc: "app/sw.ts",
    useNativeEsbuild: true,
  });
