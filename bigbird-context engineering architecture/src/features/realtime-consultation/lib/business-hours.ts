/** 실시간 상담 운영 시간: 평일 10시~18시, 한국 시간 기준(REQ-23-0020). 공휴일은 따지지 않음(사용자 결정 2026-10-29). */
const OPEN_HOUR = 10;
const CLOSE_HOUR = 18;

// 브라우저 시간대와 상관없이 한국 시간으로 요일·시각을 읽음.
const SEOUL_PARTS = new Intl.DateTimeFormat("en-US", {
  timeZone: "Asia/Seoul",
  weekday: "short",
  hour: "numeric",
  hourCycle: "h23",
});

export function isRealtimeOpenHours(now: Date): boolean {
  const parts = SEOUL_PARTS.formatToParts(now);
  const weekday = parts.find((part) => part.type === "weekday")?.value;
  const hour = Number(parts.find((part) => part.type === "hour")?.value);
  const isWeekday = weekday !== "Sat" && weekday !== "Sun";
  return isWeekday && hour >= OPEN_HOUR && hour < CLOSE_HOUR;
}
