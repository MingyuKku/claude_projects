import { fromIsoDate, toIsoDate } from "@/shared/lib";

/** 캠페인 기간(일). 종료일은 희망 시작일 + 30일이고 서버가 같은 규칙으로 저장함(API A-5.1). */
export const CAMPAIGN_PERIOD_DAYS = 30;

/** 희망 시작일(`yyyy-MM-dd`)로 예정 종료일을 계산함. 날짜가 없거나 형식이 틀리면 null. */
export function getCampaignEndDate(startDate: string | null) {
  const start = fromIsoDate(startDate);
  if (!start) return null;
  start.setDate(start.getDate() + CAMPAIGN_PERIOD_DAYS);
  return toIsoDate(start);
}
