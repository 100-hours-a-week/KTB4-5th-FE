import { EXPIRATION_MAX_YEARS } from "@/shared/config";

const seoulDateFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Seoul",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

// 날짜 판정은 KST 기준이므로 오늘도 Asia/Seoul의 YYYY-MM-DD로 구한다.
export function getTodayInSeoul() {
  return seoulDateFormatter.format(new Date());
}

// 캘린더가 다루는 Date는 로컬 자정을 기준으로 맞춰 하루가 밀리지 않게 한다.
export function fromIsoDate(isoDate: string) {
  const [year, month, day] = isoDate.split("-").map(Number);

  return new Date(year, month - 1, day);
}

export function toIsoDate(date: Date) {
  const year = String(date.getFullYear()).padStart(4, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function addDaysToIsoDate(isoDate: string, days: number) {
  const date = fromIsoDate(isoDate);

  date.setDate(date.getDate() + days);

  return toIsoDate(date);
}

// 선택 가능한 마지막 날짜. 오늘부터 4년 뒤 같은 날까지 고를 수 있다.
export function getMaxExpirationDate(todayIsoDate = getTodayInSeoul()) {
  const date = fromIsoDate(todayIsoDate);

  date.setFullYear(date.getFullYear() + EXPIRATION_MAX_YEARS);

  return toIsoDate(date);
}
