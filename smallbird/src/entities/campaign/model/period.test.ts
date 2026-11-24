import { getCampaignEndDate, getCampaignPeriodDays } from "./period";

describe("캠페인 기간", () => {
  it("브랜드형은 30일, 공구형은 60일이다", () => {
    expect(getCampaignPeriodDays("BRAND")).toBe(30);
    expect(getCampaignPeriodDays("GROUP_BUY")).toBe(60);
  });

  it("종료일은 시작일 + 상품 유형별 일수다", () => {
    expect(getCampaignEndDate("2026-11-25", "BRAND")).toBe("2026-12-25");
    expect(getCampaignEndDate("2026-11-25", "GROUP_BUY")).toBe("2027-01-24");
  });

  it("시작일이 없으면 null이다", () => {
    expect(getCampaignEndDate(null, "GROUP_BUY")).toBeNull();
  });
});
