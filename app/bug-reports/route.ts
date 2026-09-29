import type { NextRequest } from "next/server";

import { postBugReport } from "@/_app/api-routes/bug-report/index.server";

// 운영 nginx가 /api/* 전체를 백엔드로 넘기므로 app/api 밖에 둔다.
export function POST(request: NextRequest) {
  return postBugReport(request);
}
