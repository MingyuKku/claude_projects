import type { UsageGranularity } from "@/entities/subscription";

export type UsageLayout = "desktop" | "tablet" | "mobile";

// 한 번에 보이는 막대 묶음(월·일) 수(스펙 §3 이용요약 차트). PC 월별은 12개 전체라 캐러셀이 없음.
const VISIBLE_COUNT: Record<UsageGranularity, Record<UsageLayout, number>> = {
  monthly: { desktop: 12, tablet: 7, mobile: 3 },
  daily: { desktop: 11, tablet: 7, mobile: 3 },
};

export function getVisibleCount(
  granularity: UsageGranularity,
  layout: UsageLayout,
): number {
  return VISIBLE_COUNT[granularity][layout];
}

/** 전체 항목이 한 화면에 다 들어가면 캐러셀 버튼을 그리지 않음. */
export function hasCarousel(total: number, visibleCount: number): boolean {
  return total > visibleCount;
}

/** 처음 보이는 구간의 시작 위치. `focusIndex`(이번 달·오늘)가 구간의 마지막에 오게 하고, 없으면 가장 최근 구간. */
export function getInitialStart(
  total: number,
  visibleCount: number,
  focusIndex: number | null,
): number {
  const maxStart = Math.max(0, total - visibleCount);
  if (focusIndex === null) return maxStart;
  return Math.min(Math.max(0, focusIndex - visibleCount + 1), maxStart);
}

/** ←: 보이는 개수만큼 앞으로. */
export function getPrevStart(start: number, visibleCount: number): number {
  return Math.max(0, start - visibleCount);
}

/** →: 보이는 개수만큼 뒤로. 마지막 구간은 항상 꽉 차게 맞춤. */
export function getNextStart(
  start: number,
  visibleCount: number,
  total: number,
): number {
  return Math.min(Math.max(0, total - visibleCount), start + visibleCount);
}

export function canGoPrev(start: number): boolean {
  return start > 0;
}

export function canGoNext(
  start: number,
  visibleCount: number,
  total: number,
): boolean {
  return start + visibleCount < total;
}
