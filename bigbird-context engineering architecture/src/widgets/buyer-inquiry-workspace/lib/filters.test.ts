import { toBuyerInquiryFilters, toBuyerStatusFilter } from "./filters";

describe("구매자 문의 URL 필터", () => {
  it("URL의 등록일 범위가 모두 올바를 때만 필터로 읽는다", () => {
    expect(
      toBuyerInquiryFilters(
        new URLSearchParams("startDate=2026-11-01&endDate=2026-11-07"),
      ),
    ).toMatchObject({ startDate: "2026-11-01", endDate: "2026-11-07" });
    expect(
      toBuyerInquiryFilters(new URLSearchParams("startDate=2026-11-01")),
    ).toMatchObject({ startDate: undefined, endDate: undefined });
  });

  it("모르는 status 값은 전체로 본다", () => {
    expect(toBuyerStatusFilter("reinquiry")).toBe("all");
    expect(toBuyerStatusFilter("waiting")).toBe("waiting");
  });
});
