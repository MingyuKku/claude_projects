import { toCampaignListParams, toCopySourceParams } from "./to-list-params";

describe("toCampaignListParams", () => {
  it("조건이 없으면 쪽 번호와 한 쪽 개수만 보낸다", () => {
    expect(
      toCampaignListParams({
        statuses: [],
        type: null,
        keyword: "  ",
        page: 2,
      }),
    ).toEqual({ page: 2, entrySize: 15 });
  });

  it("상태는 콤마로 잇고 유형 필터는 서비스·상품 코드로 나눈다", () => {
    expect(
      toCampaignListParams({
        statuses: ["REVIEWING", "REJECTED"],
        type: "pickBrand",
        keyword: " 톤업 ",
        page: 1,
      }),
    ).toEqual({
      status: "REVIEWING,REJECTED",
      serviceType: "PICK",
      productType: "BRAND",
      keyword: "톤업",
      page: 1,
      entrySize: 15,
    });
  });
});

describe("toCopySourceParams", () => {
  it("상태는 보내지 않고 지금 캠페인을 뺀다", () => {
    expect(
      toCopySourceParams(
        {
          serviceType: "PICK",
          productType: "BRAND",
          excludeCampaignIdx: 15,
          keyword: "",
        },
        3,
      ),
    ).toEqual({
      serviceType: "PICK",
      productType: "BRAND",
      excludeCampaignIdx: 15,
      page: 3,
      entrySize: 20,
    });
  });
});
