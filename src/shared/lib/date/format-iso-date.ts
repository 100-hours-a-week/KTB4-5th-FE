export function formatIsoDate(isoDate: string): string {
  return isoDate.replaceAll("-", ".");
}
