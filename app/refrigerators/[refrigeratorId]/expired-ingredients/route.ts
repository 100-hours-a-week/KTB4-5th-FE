import type { NextRequest } from "next/server";

import { getExpiredIngredients } from "@/_app/api-routes/expired-ingredients";

export async function GET(
  request: NextRequest,
  {
    params,
  }: RouteContext<"/refrigerators/[refrigeratorId]/expired-ingredients">,
) {
  return getExpiredIngredients(request, (await params).refrigeratorId);
}
