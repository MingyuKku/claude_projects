import { toUsageQuery } from "./usage-query";

describe("toUsageQuery", () => {
  it("필터가 없으면 쪽 크기만 보낸다", () => {
    expect(toUsageQuery({}, 20)).toEqual({ entrySize: 20 });
  });

  it("주소의 필터 값을 서버 코드로 바꿔 함께 보낸다", () => {
    expect(
      toUsageQuery(
        {
          type: "withdraw",
          dateFrom: "2026-10-01",
          dateTo: "2026-10-30",
          campaign: "123",
          usage: "AI_POSTING_GUIDE",
        },
        10,
      ),
    ).toEqual({
      entrySize: 10,
      type: "WITHDRAWAL",
      startDate: "2026-10-01",
      endDate: "2026-10-30",
      campaignIdx: 123,
      usageDetailCode: "AI_POSTING_GUIDE",
    });
  });

  it("모르는 값과 한쪽만 있는 기간은 보내지 않는다", () => {
    expect(
      toUsageQuery(
        {
          type: "constructor",
          dateFrom: "2026-10-01",
          campaign: "abc",
          usage: "",
        },
        10,
      ),
    ).toEqual({ entrySize: 10 });
  });

  it("검색어는 앞뒤 공백을 지우고 있을 때만 100자까지 보낸다", () => {
    expect(toUsageQuery({}, 10, "  PICK형 ")).toEqual({
      entrySize: 10,
      keyword: "PICK형",
    });
    expect(toUsageQuery({}, 10, "   ")).toEqual({ entrySize: 10 });
    expect(toUsageQuery({}, 10, "가".repeat(120)).keyword).toHaveLength(100);
  });
});
