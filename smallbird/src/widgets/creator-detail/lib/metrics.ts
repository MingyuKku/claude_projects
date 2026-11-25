import type { CreatorMetrics } from "@/entities/creator";

/** '전체'는 큰 숫자로 이미 보여 뺌. */
export function getCategoryIndexes(
  metrics: CreatorMetrics,
  key: "brandIndex" | "groupBuyIndex",
  allCategoryIdx: number | undefined,
) {
  return metrics.categoryBreakdown.flatMap((category) => {
    const value = category[key];
    return category.categoryIdx === allCategoryIdx || value === null
      ? []
      : [{ id: category.categoryIdx, name: category.categoryName, value }];
  });
}

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

/** 차트 축 이름. `2026-11` → `Nov`(모든 언어에서 영어 월). */
export function getShortMonth(yearMonth: string) {
  return MONTHS[Number(yearMonth.split("-")[1]) - 1] ?? yearMonth;
}

/** 크롤링이 안 된 달은 값이 없어 뺌. */
export function getFollowerTrend(metrics: CreatorMetrics) {
  return metrics.recentActivityTrend.flatMap(({ yearMonth, followerCount }) =>
    followerCount === null ? [] : [{ yearMonth, followerCount }],
  );
}
