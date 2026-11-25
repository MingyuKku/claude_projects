import { getCategoryIndexes, getFollowerTrend, getShortMonth } from "./metrics";

import type { CreatorMetrics } from "@/entities/creator";

const metrics = {
  categoryBreakdown: [
    {
      categoryIdx: 178,
      categoryName: "All",
      brandIndex: 41.6,
      groupBuyIndex: 1,
    },
    {
      categoryIdx: 5,
      categoryName: "뷰티",
      brandIndex: 31.5,
      groupBuyIndex: null,
    },
  ],
  recentActivityTrend: [
    { yearMonth: "2026-09", followerCount: 10 },
    { yearMonth: "2026-10", followerCount: null },
  ],
} as CreatorMetrics;

describe("getCategoryIndexes", () => {
  it("전체와 값이 없는 카테고리는 뺀다", () => {
    expect(getCategoryIndexes(metrics, "brandIndex", 178)).toEqual([
      { id: 5, name: "뷰티", value: 31.5 },
    ]);
    expect(getCategoryIndexes(metrics, "groupBuyIndex", 178)).toEqual([]);
  });
});

describe("getFollowerTrend", () => {
  it("값이 없는 달은 뺀다", () => {
    expect(getFollowerTrend(metrics)).toEqual([
      { yearMonth: "2026-09", followerCount: 10 },
    ]);
  });
});

it("축 이름은 영어 월, 모르는 값은 그대로", () => {
  expect(getShortMonth("2026-11")).toBe("Nov");
  expect(getShortMonth("2026-01")).toBe("Jan");
  expect(getShortMonth("2026")).toBe("2026");
});
