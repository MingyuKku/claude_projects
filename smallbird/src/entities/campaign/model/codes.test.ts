import {
  CAMPAIGN_TYPE_FILTERS,
  getTypeFilterCodes,
  isCampaignTypeFilter,
  toCampaignStage,
  toCampaignTypeFilter,
} from "./codes";

describe("toCampaignStage", () => {
  it("서버 진행 단계 코드를 그대로 돌려준다", () => {
    expect(toCampaignStage("DRAFT")).toBe("DRAFT");
    expect(toCampaignStage("IN_PROGRESS")).toBe("IN_PROGRESS");
  });

  it("모르는 코드나 값이 없으면 null이라 호출하는 쪽이 서버 값을 그대로 보인다", () => {
    expect(toCampaignStage("PENDING")).toBeNull();
    expect(toCampaignStage(null)).toBeNull();
    expect(toCampaignStage(undefined)).toBeNull();
  });
});

describe("캠페인 유형 필터 변환", () => {
  it.each(CAMPAIGN_TYPE_FILTERS)(
    "%s 는 서버 코드로 바꿨다가 다시 같은 필터로 돌아온다",
    (filter) => {
      const { serviceType, productType } = getTypeFilterCodes(filter);
      expect(toCampaignTypeFilter(serviceType, productType)).toBe(filter);
    },
  );

  it("모르는 서비스·상품 조합은 null이다", () => {
    expect(toCampaignTypeFilter("LIVE", "BRAND")).toBeNull();
    expect(toCampaignTypeFilter("RECRUIT", "UNKNOWN")).toBeNull();
  });

  it("주소 쿼리 값은 선택지에 있는 값만 필터로 인정한다", () => {
    expect(isCampaignTypeFilter("pickBrand")).toBe(true);
    expect(isCampaignTypeFilter("pick")).toBe(false);
    expect(isCampaignTypeFilter(null)).toBe(false);
  });
});
