const seoulDateFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Seoul",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

export function getTodayInSeoul() {
  return seoulDateFormatter.format(new Date());
}

const seoulHourFormatter = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Asia/Seoul",
  hour: "2-digit",
  hourCycle: "h23",
});

export function isWithinAiServiceHours() {
  const hour = Number(seoulHourFormatter.format(new Date()));
  return hour >= 9 && hour < 18;
}
