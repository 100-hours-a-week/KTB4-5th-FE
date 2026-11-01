import { http, HttpResponse, passthrough } from "msw";

const streams = new Set<ReadableStreamDefaultController<Uint8Array>>();

export function emitMockEvent(event: string, data: unknown) {
  const chunk = new TextEncoder().encode(
    `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`,
  );
  streams.forEach((controller) => {
    try {
      controller.enqueue(chunk);
    } catch {
      streams.delete(controller);
    }
  });
}

export const mockEventStreamHandler = http.get(
  "*/api/v2/refrigerators/:refrigeratorId/notifications/stream",
  ({ cookies }) =>
    cookies.recommendationMock || cookies.imageAnalysisMock
      ? new HttpResponse(
          new ReadableStream({
            start(controller) {
              streams.add(controller);
              controller.enqueue(new TextEncoder().encode(": mock\n\n"));
            },
          }),
          { headers: { "Content-Type": "text/event-stream" } },
        )
      : passthrough(),
);
