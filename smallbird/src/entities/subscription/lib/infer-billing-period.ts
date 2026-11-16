import type { BillingPeriod } from "../model/codes";

const DAY_MS = 24 * 60 * 60 * 1000;
// 한 달(28~31일)·한 해(365~366일). 그 밖의 간격은 주기를 단정하지 않음.
const MONTH_DAYS = { min: 28, max: 31 };
const YEAR_DAYS = { min: 365, max: 366 };

function toUtcTime(date: string) {
  return Date.parse(`${date}T00:00:00Z`);
}

/**
 * 멤버십 시작·종료일(`YYYY-MM-DD`, 이번 결제 주기)의 간격으로 결제 주기를 정함.
 * 구독 목록 응답에 결제 주기 코드가 없어 쓰는 방법(마이페이지 QA 2026-11-16). 판단할 수 없으면 null.
 */
export function inferBillingPeriod(
  startedAt: string,
  endsAt: string,
): BillingPeriod | null {
  const days = Math.round((toUtcTime(endsAt) - toUtcTime(startedAt)) / DAY_MS);
  if (Number.isNaN(days)) return null;
  if (days >= MONTH_DAYS.min && days <= MONTH_DAYS.max) return "monthly";
  if (days >= YEAR_DAYS.min && days <= YEAR_DAYS.max) return "yearly";
  return null;
}
