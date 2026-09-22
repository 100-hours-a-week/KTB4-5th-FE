export function getCookieValue(name: string): string | null {
  if (typeof document === "undefined") {
    return null;
  }

  const prefix = `${name}=`;
  const cookie = document.cookie
    .split("; ")
    .find((entry) => entry.startsWith(prefix));

  if (!cookie) {
    return null;
  }

  return decodeURIComponent(cookie.slice(prefix.length));
}
