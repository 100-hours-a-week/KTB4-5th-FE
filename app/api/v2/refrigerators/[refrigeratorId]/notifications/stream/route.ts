import { proxyNotificationStream } from "@/_app/api-routes/notification-stream";

export async function GET(
  request: Request,
  {
    params,
  }: RouteContext<"/api/v2/refrigerators/[refrigeratorId]/notifications/stream">,
) {
  return proxyNotificationStream(request, (await params).refrigeratorId);
}
