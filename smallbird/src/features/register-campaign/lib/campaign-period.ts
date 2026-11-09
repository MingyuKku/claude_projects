import { fromIsoDate, toIsoDate } from "@/shared/lib";

/** 종료일은 시작일 + 30일로 서버가 정함. 시작일을 고르는 즉시 화면에 보이려고 같은 규칙으로 계산함. */
export const CAMPAIGN_PERIOD_DAYS = 30;

/** 시작일(`yyyy-MM-dd`)의 30일 뒤. 시작일이 없거나 형식이 틀리면 null. */
export function calculateEndDate(startDate: string | null) {
  const start = fromIsoDate(startDate);
  if (!start) return null;
  const end = new Date(start);
  end.setDate(end.getDate() + CAMPAIGN_PERIOD_DAYS);
  return toIsoDate(end);
}

/** 오늘 0시(지역 시간). 오늘 이전 날짜만 막는 캘린더가 씀. */
export function startOfToday(now = new Date()) {
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}
