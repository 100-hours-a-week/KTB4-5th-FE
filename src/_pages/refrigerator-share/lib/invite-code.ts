export const INVITE_CODE_LENGTH = 6;

export function formatInviteCode(code: string): string {
  return code.length > 3 ? `${code.slice(0, 3)}-${code.slice(3)}` : code;
}

export function normalizeInviteCodeInput(value: string): string {
  return value
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, INVITE_CODE_LENGTH);
}

export function formatRemainingTime(remainingMs: number): string {
  const totalSeconds = Math.max(0, Math.floor(remainingMs / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return [hours, minutes, seconds]
    .map((value) => String(value).padStart(2, "0"))
    .join(":");
}
