import type { DateRange } from "react-day-picker";

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

function pad(value: number) {
  return String(value).padStart(2, "0");
}

/** 달력에서 고른 날짜를 서버가 받는 `yyyy-MM-dd`로 바꿉니다(브라우저 지역 날짜 기준). */
export function toIsoDate(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** URL의 `yyyy-MM-dd`를 지역 날짜로 읽습니다. 형식이 틀리거나 없는 날짜면 undefined입니다. */
export function fromIsoDate(value: string | null | undefined) {
  if (!value || !ISO_DATE.test(value)) return undefined;
  const date = new Date(
    Number(value.slice(0, 4)),
    Number(value.slice(5, 7)) - 1,
    Number(value.slice(8, 10)),
  );
  return toIsoDate(date) === value ? date : undefined;
}

/** 필터의 시작일·종료일 문자열을 달력 값으로 바꿉니다. 시작일이 없으면 범위가 없는 것입니다. */
export function toDateRange(startDate?: string, endDate?: string) {
  const from = fromIsoDate(startDate);
  if (!from) return undefined;
  const range: DateRange = { from, to: fromIsoDate(endDate) };
  return range;
}
