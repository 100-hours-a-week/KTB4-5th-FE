const STORAGE_KEY = "dameokja.expiringAnalysisNoticeSeen";

export function readSeenExpiringNotices(): string[] {
  try {
    const stored: unknown = JSON.parse(
      window.localStorage.getItem(STORAGE_KEY) ?? "[]",
    );
    return Array.isArray(stored)
      ? stored.filter((id) => typeof id === "string")
      : [];
  } catch {
    return [];
  }
}

export function markExpiringNoticeSeen(analysisId: string): void {
  try {
    const seen = readSeenExpiringNotices();
    if (seen.includes(analysisId)) return;
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify([...seen, analysisId].slice(-20)),
    );
  } catch {}
}
