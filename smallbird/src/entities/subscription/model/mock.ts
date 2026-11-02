// 임시 목 데이터(스펙 §1·§5, 구독 API 요청 B-1). 구독 API가 공개되면 이 파일과 api/의 목 분기를 지움.
// 개발 서버에서만 채우고 빌드(stage·prod)에서는 비어 있어 번들에 목 값이 들어가지 않음(account.md §1 "목은 개발 서버에서만").
import { isActiveProductType, USAGE_METRICS_BY_TYPE } from "./codes";

import type { ActiveProductType, UsageMetric } from "./codes";
import type {
  Subscription,
  UsageBreakdown,
  UsageSeriesPoint,
  UsageSeriesQuery,
  UsageSummary,
} from "./types";

/** 목 데이터를 쓸 수 있는지. false(빌드)면 화면은 "준비 중" 빈 상태를 보임. API가 공개되면 지움. */
export const IS_SUBSCRIPTION_MOCK_ENABLED = import.meta.env.DEV;

/** 오늘(목 데이터 기준). 이용요약의 "올해는 이번 달까지"와 캐러셀 처음 위치에 씀. */
export function getMockToday() {
  return new Date();
}

const MOCK_SUBSCRIPTIONS: Record<ActiveProductType, Subscription> = {
  recruit: {
    id: "sub-recruit",
    type: "recruit",
    productName: "월 구독 상품_모집형",
    startedAt: "2026-10-01",
    endsAt: "2026-10-31",
    amount: 99999,
    paymentMethod: "card",
    isCancelScheduled: false,
  },
  pick: {
    id: "sub-pick",
    type: "pick",
    productName: "월 구독 상품_PICK형",
    startedAt: "2026-09-15",
    endsAt: "2026-10-14",
    amount: 199999,
    paymentMethod: "cardInstallment",
    isCancelScheduled: true,
  },
};

/**
 * 이용요약 목이 구독 여부를 정하는 데 씀(구독 목록은 실제 API라 이 값과 따로임). `?mock=` 쿼리로 바꿔 볼 수 있음(개발 서버 전용): `none`·`recruit`(기본)·`pick`·`both`.
 * 미구독·PICK형 이용요약 등 상태별 화면을 확인하려는 용도.
 */
function getMockSubscriptions(): Subscription[] {
  if (!import.meta.env.DEV) return [];
  const mode = new URLSearchParams(window.location.search).get("mock");
  if (mode === "none") return [];
  if (mode === "pick") return [MOCK_SUBSCRIPTIONS.pick];
  if (mode === "both")
    return [MOCK_SUBSCRIPTIONS.recruit, MOCK_SUBSCRIPTIONS.pick];
  return [MOCK_SUBSCRIPTIONS.recruit];
}

const MOCK_TOTALS: Record<
  ActiveProductType,
  {
    search: { used: number; remaining: number };
    proposal: { used: number; remaining: number };
    brand: UsageBreakdown;
    groupBuy: UsageBreakdown;
  }
> = {
  recruit: {
    search: { used: 320, remaining: 180 },
    proposal: { used: 45, remaining: 55 },
    brand: { campaignCount: 8, searchCount: 210, proposalCount: 30 },
    groupBuy: { campaignCount: 5, searchCount: 110, proposalCount: 15 },
  },
  pick: {
    search: { used: 120, remaining: 380 },
    proposal: { used: 28, remaining: 72 },
    brand: {
      campaignCount: 4,
      searchCount: 80,
      proposalCount: 18,
      matchCount: 6,
    },
    groupBuy: {
      campaignCount: 3,
      searchCount: 40,
      proposalCount: 10,
      matchCount: 2,
    },
  },
};

export function getMockUsageSummary(type: ActiveProductType): UsageSummary {
  const subscribed = getMockSubscriptions().some((item) => item.type === type);
  if (!subscribed) return { type, isSubscribed: false };
  return { type, isSubscribed: true, ...MOCK_TOTALS[type] };
}

// 같은 입력이면 같은 값이 나오는 간단한 의사 난수(차트가 렌더마다 흔들리지 않게).
function seeded(seed: number) {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

const METRIC_SEED: Record<UsageMetric, number> = {
  campaignCount: 1,
  searchCount: 2,
  proposalCount: 3,
  matchCount: 4,
};
const METRIC_SCALE: Record<UsageMetric, number> = {
  campaignCount: 6,
  searchCount: 60,
  proposalCount: 25,
  matchCount: 8,
};

function daysInMonth(year: number, month: number) {
  return new Date(year, month, 0).getDate();
}

/** 목 이용 시계열. 미래 기간은 포함하지 않음(올해는 이번 달까지, 이번 달은 오늘까지). */
export function getMockUsageSeries(
  query: UsageSeriesQuery,
): UsageSeriesPoint[] {
  const { type, metric, granularity, year, month = 1 } = query;
  if (
    !isActiveProductType(type) ||
    !USAGE_METRICS_BY_TYPE[type].includes(metric)
  )
    return [];
  const today = getMockToday();
  const lastPeriod =
    granularity === "monthly"
      ? year === today.getFullYear()
        ? today.getMonth() + 1
        : 12
      : year === today.getFullYear() && month === today.getMonth() + 1
        ? today.getDate()
        : daysInMonth(year, month);
  // 일별은 월별보다 작되 차트가 거의 빈 막대로 보이지 않도록 최소 크기를 둠.
  const scale =
    granularity === "daily"
      ? Math.max(METRIC_SCALE[metric] / 4, 8)
      : METRIC_SCALE[metric];
  const base = year * 100 + (granularity === "daily" ? month : 0);
  return Array.from({ length: lastPeriod }, (_, index) => {
    const period = index + 1;
    const seed = base * 31 + period * 7 + METRIC_SEED[metric];
    return {
      period,
      brand: Math.round(seeded(seed) * scale),
      groupBuy: Math.round(seeded(seed + 0.5) * scale),
    };
  });
}
