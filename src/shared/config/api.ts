export function getApiBaseUrl(): string {
  const url = process.env.NEXT_PUBLIC_API_BASE_URL;

  if (!url) {
    throw new Error("NEXT_PUBLIC_API_BASE_URL이 설정되지 않았습니다.");
  }

  return url.replace(/\/+$/, "");
}
