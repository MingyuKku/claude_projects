import { transformUsageList } from "./transform-usage";

const item = {
  usageType: "사용",
  usageDetails: "인플루언서 계약비용(PICK형)",
  usageDate: "2026-10-23 14:23:18",
  campaignName: "2026 여름 시즌 캠핑 용품 신제품 리뷰",
  campaignCode: "CP0001",
  campaignService: "PICK형",
  code: "A01",
  usageAmount: -50000,
  remainingAmount: 1250000,
};

describe("transformUsageList", () => {
  it("항목을 뷰모델로 바꾸고 쪽 수를 건수에서 계산한다", () => {
    const result = transformUsageList({
      list: [item],
      count: 21,
      currentPage: 2,
      entrySize: 10,
    });

    expect(result.totalCount).toBe(21);
    expect(result.page).toBe(2);
    expect(result.totalPages).toBe(3);
    expect(result.records[0]).toMatchObject({
      id: "0",
      campaignName: "2026 여름 시즌 캠핑 용품 신제품 리뷰",
      campaignCode: "CP0001",
      campaignType: "PICK형",
      usageLabel: "인플루언서 계약비용(PICK형)",
      amount: -50000,
      remainingAmount: 1250000,
    });
    expect(result.records[0]?.usedAt).toEqual(new Date("2026-10-23T14:23:18"));
  });

  it("값이 없는 항목은 대시로 두고 금액은 null로 둔다", () => {
    const { records } = transformUsageList({
      list: [
        {
          usageType: null,
          usageDetails: null,
          usageDate: null,
          campaignName: "-",
          campaignCode: "",
          campaignService: undefined,
          usageAmount: null,
          remainingAmount: null,
        },
      ],
      count: 1,
      currentPage: 1,
      entrySize: 10,
    });

    expect(records[0]).toMatchObject({
      usedAt: null,
      usedAtText: "-",
      campaignName: "-",
      campaignCode: "-",
      campaignType: "-",
      usageLabel: "-",
      amount: null,
      remainingAmount: null,
    });
  });

  it("사용 내역이 없으면 사용 유형으로 보인다", () => {
    const { records } = transformUsageList({
      list: [{ ...item, usageDetails: null, usageType: "환불" }],
      count: 1,
      currentPage: 1,
      entrySize: 10,
    });
    expect(records[0]?.usageLabel).toBe("환불");
  });

  it("서버 날짜를 읽지 못하면 원문을 그대로 둔다", () => {
    const { records } = transformUsageList({
      list: [{ ...item, usageDate: "어제" }],
      count: 1,
      currentPage: 1,
      entrySize: 10,
    });
    expect(records[0]?.usedAt).toBeNull();
    expect(records[0]?.usedAtText).toBe("어제");
  });
});
