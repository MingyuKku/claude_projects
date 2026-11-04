import {
  toBuyerInquiryFilters,
  toBuyerStatusFilter,
  toSourceParam,
} from "./filters";

describe("구매자 문의 URL 필터", () => {
  it("URL의 등록일 범위가 모두 올바를 때만 필터로 읽는다", () => {
    expect(
      toBuyerInquiryFilters(
        new URLSearchParams("startDate=2026-11-01&endDate=2026-11-07"),
        "buyer",
      ),
    ).toMatchObject({ startDate: "2026-11-01", endDate: "2026-11-07" });
    expect(
      toBuyerInquiryFilters(
        new URLSearchParams("startDate=2026-11-01"),
        "buyer",
      ),
    ).toMatchObject({ startDate: undefined, endDate: undefined });
  });

  it("문의 유형은 그 메뉴의 출처만 읽고 다른 메뉴 값은 전체로 본다", () => {
    const params = new URLSearchParams("source=campaignQna");
    expect(toBuyerInquiryFilters(params, "influencer").sourceType).toBe(
      "CAMPAIGN_QNA",
    );
    expect(toBuyerInquiryFilters(params, "buyer").sourceType).toBe("ALL");
    expect(toSourceParam("CAMPAIGN_QNA")).toBe("campaignQna");
    expect(toSourceParam("ALL")).toBeUndefined();
  });

  it("모르는 status 값은 전체로 본다", () => {
    expect(toBuyerStatusFilter("reinquiry")).toBe("all");
    expect(toBuyerStatusFilter("waiting")).toBe("waiting");
  });
});
