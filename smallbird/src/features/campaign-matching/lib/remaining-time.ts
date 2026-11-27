const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/** 남은 시간. 하루 이상이면 일·시간, 그 밖은 시간·분(시안 "2일 21시간"·"99시간 99분"). 지났거나 기한이 없으면 null. */
export type RemainingTime =
  | { unit: "day"; days: number; hours: number }
  | { unit: "hour"; hours: number; minutes: number };

export function getRemainingTime(
  deadline: string | null,
  now: number,
): RemainingTime | null {
  if (!deadline) return null;
  const left = new Date(deadline).getTime() - now;
  if (!Number.isFinite(left) || left <= 0) return null;
  if (left >= DAY) {
    return {
      unit: "day",
      days: Math.floor(left / DAY),
      hours: Math.floor((left % DAY) / HOUR),
    };
  }
  return {
    unit: "hour",
    hours: Math.floor(left / HOUR),
    minutes: Math.floor((left % HOUR) / MINUTE),
  };
}

/** setTimeout이 받는 가장 긴 지연(약 24.8일). 넘기면 브라우저가 곧바로 실행함. */
const MAX_TIMEOUT = 2 ** 31 - 1;

/** 지금 보이는 줄 중 가장 먼저 기한이 끝나는 시각까지 남은 ms(타이머 한도 안). 기한이 지나면 목록을 다시 읽음. */
export function getNextExpiryDelay(deadlines: (string | null)[], now: number) {
  const lefts = deadlines
    .map((deadline) => (deadline ? new Date(deadline).getTime() - now : NaN))
    .filter((left) => Number.isFinite(left) && left > 0 && left < MAX_TIMEOUT);
  return lefts.length > 0 ? Math.min(...lefts) : null;
}
