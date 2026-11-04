import { renderHook } from "@testing-library/react";

import { useTranslation } from "@/shared/i18n";

import { getBuyerCardText, formatDividerDate } from "./format";

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
    sequence: null,
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
  it("캠페인 목록에서 찾은 브랜드명과 캠페인명을 나눠 준다", () => {
    expect(getBuyerCardText(inquiry(), [campaign])).toEqual({
      kind: "campaign",
      brandName: "빅버드",
      campaignName: "스킨케어 세트",
    });
  });

  it("서버가 준 값이 먼저다", () => {
    expect(
      getBuyerCardText(
        inquiry({ brandName: "브랜드", campaignName: "캠페인" }),
        [campaign],
      ),
    ).toEqual({
      kind: "campaign",
      brandName: "브랜드",
      campaignName: "캠페인",
    });
  });

  it("브랜드명이 없으면 캠페인명만, 캠페인명을 못 찾으면 내용 처음 10자를 보인다", () => {
    expect(getBuyerCardText(inquiry({ campaignName: "캠페인" }), [])).toEqual({
      kind: "campaign",
      brandName: null,
      campaignName: "캠페인",
    });
    expect(getBuyerCardText(inquiry({ campaignIdx: 99 }), [campaign])).toEqual({
      kind: "preview",
      text: "주문했는데 배송 시...",
    });
    expect(
      getBuyerCardText(inquiry({ campaignIdx: 99, preview: "짧은 문의" }), []),
    ).toEqual({ kind: "preview", text: "짧은 문의" });
  });
});

// i18next는 shared/i18n 밖에서 직접 임포트할 수 없어 useTranslation의 i18n으로 언어를 바꿈.
function changeLanguage(language: string) {
  const { result } = renderHook(() => useTranslation());
  return result.current.i18n.changeLanguage(language);
}

describe("formatDividerDate", () => {
  afterEach(async () => {
    await changeLanguage("ko");
  });

  it.each([
    ["ko", "26.9.8 (화)"],
    ["en", "26.9.8 (Tue)"],
    ["ja", "26.9.8 (火)"],
    ["zh-CN", "26.9.8 (周二)"],
  ])(
    "%s에서 Figma 표기(26.9.8 (요일))로 쓰고 요일만 번역한다",
    async (language, expected) => {
      await changeLanguage(language);
      expect(formatDividerDate(new Date(2026, 8, 8))).toBe(expected);
    },
  );
});
