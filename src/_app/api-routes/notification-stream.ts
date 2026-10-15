export async function proxyNotificationStream(
  request: Request,
  refrigeratorId: string,
): Promise<Response> {
  const backendOrigin = process.env.BACKEND_ORIGIN ?? "http://localhost:8080";
  const url = new URL(
    `/api/v2/refrigerators/${encodeURIComponent(refrigeratorId)}/notifications/stream`,
    backendOrigin,
  );
  const headers = new Headers({ Accept: "text/event-stream" });
  const cookie = request.headers.get("cookie");
  if (cookie) headers.set("cookie", cookie);

  try {
    const upstream = await fetch(url, {
      headers,
      cache: "no-store",
      signal: request.signal,
    });
    const responseHeaders = new Headers({
      // Next의 gzip 압축이 작은 SSE 이벤트를 버퍼에 묶어 두지 않게 한다.
      "Cache-Control": "no-store, no-transform",
      "Content-Type":
        upstream.headers.get("content-type") ?? "application/json",
      "X-Accel-Buffering": "no",
    });
    for (const value of upstream.headers.getSetCookie()) {
      responseHeaders.append("Set-Cookie", value);
    }
    return new Response(upstream.body, {
      status: upstream.status,
      headers: responseHeaders,
    });
  } catch {
    return Response.json(
      {
        code: "GLOBAL-500-001",
        message: "서버에서 요청을 처리하지 못했습니다.",
      },
      { status: 500 },
    );
  }
}
