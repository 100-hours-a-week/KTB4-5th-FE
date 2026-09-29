import type { NextRequest } from "next/server";

import { postBugReport } from "@/_app/api-routes/bug-report/index.server";

export function POST(request: NextRequest) {
  return postBugReport(request);
}
