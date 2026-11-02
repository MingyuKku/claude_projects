/** 이용 현황의 가장 이른 연도(스펙 §3, 목: 2022~올해). */
export const FIRST_USAGE_YEAR = 2022;

/** 올해부터 가장 이른 연도까지(내림차순, 시안 순서). */
export function getYearOptions(currentYear: number): number[] {
  return Array.from(
    { length: Math.max(0, currentYear - FIRST_USAGE_YEAR + 1) },
    (_, index) => currentYear - index,
  );
}

/** 1~12월, 올해는 이번 달까지. */
export function getMonthOptions(
  year: number,
  currentYear: number,
  currentMonth: number,
): number[] {
  const last = year === currentYear ? currentMonth : 12;
  return Array.from({ length: last }, (_, index) => index + 1);
}

/** 연도를 바꿨을 때 고를 수 없게 된 달(올해의 미래 달)을 이번 달로 당김. */
export function clampMonth(
  month: number,
  year: number,
  currentYear: number,
  currentMonth: number,
): number {
  return year === currentYear ? Math.min(month, currentMonth) : month;
}
