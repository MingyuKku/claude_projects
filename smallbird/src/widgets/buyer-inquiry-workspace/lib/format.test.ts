import { getBuyerCardText } from "./format";

import type {
  BuyerInquiryViewModel,
  InquiryCampaignViewModel,
} from "@/entities/inquiry";

function inquiry(
  overrides: Partial<BuyerInquiryViewModel> = {},
): BuyerInquiryViewModel {
  return {
    key: "purchaser-1",
    inquiryIdx: 1,
    source: "purchaser",
    status: "waiting",
    campaignIdx: 10,
    orderNumber: null,
    writerName: "김하루",
    body: null,
    writeTime: null,
    threadUserIdx: 77,
    userIdx: null,
    preview: "주문했는데 배송 시작이 늦어지는 것 같습니다",
    lastActivityAt: null,
    hasUnread: false,
    brandName: null,
    campaignName: null,
    shopName: null,
    ...overrides,
  };
}

const campaign = {
  campaignIdx: 10,
  brandName: "빅버드",
  productName: "스킨케어 세트",
} as InquiryCampaignViewModel;

describe("getBuyerCardText", () => {
  it("캠페인 문의는 캠페인 목록에서 찾은 브랜드·캠페인명을 대괄호로 잇는다", () => {
    expect(getBuyerCardText(inquiry(), [campaign])).toEqual({
      kind: "campaign",
      label: "[빅버드][스킨케어 세트]",
    });
  });

  it("서버가 준 값이 먼저이고 공구샵명도 붙인다", () => {
    expect(
      getBuyerCardText(
        inquiry({
          brandName: "브랜드",
          campaignName: "캠페인",
          shopName: "샵",
        }),
        [campaign],
      ),
    ).toEqual({ kind: "campaign", label: "[브랜드][캠페인][샵]" });
  });

  it("기타 문의(캠페인 없음)와 캠페인을 못 찾은 문의는 내용 처음 10자를 보인다", () => {
    const expected = { kind: "preview", text: "주문했는데 배송 시..." };
    expect(
      getBuyerCardText(inquiry({ campaignIdx: null }), [campaign]),
    ).toEqual(expected);
    expect(getBuyerCardText(inquiry({ campaignIdx: 99 }), [campaign])).toEqual(
      expected,
    );
    expect(
      getBuyerCardText(
        inquiry({ campaignIdx: null, preview: "짧은 문의" }),
        [],
      ),
    ).toEqual({ kind: "preview", text: "짧은 문의" });
  });
});
