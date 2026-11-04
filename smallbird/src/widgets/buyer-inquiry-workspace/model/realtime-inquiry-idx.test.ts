import {
  getRealtimeInquiryIdx,
  isOpenedByUser,
  OPENED_BY_USER_STATE,
} from "./realtime-inquiry-idx";

import type { BuyerInquiryViewModel } from "@/entities/inquiry";

const inquiry = (over: Partial<BuyerInquiryViewModel>) =>
  ({
    inquiryIdx: 2100,
    source: "purchaser",
    status: "consulting",
    ...over,
  }) as BuyerInquiryViewModel;

describe("getRealtimeInquiryIdx", () => {
  it("구매자·인플루언서 문의가 상담 중이면 그 문의 번호", () => {
    expect(getRealtimeInquiryIdx(inquiry({}))).toBe(2100);
    expect(getRealtimeInquiryIdx(inquiry({ source: "influencer" }))).toBe(2100);
  });

  it("상담 중이 아니거나 Q&A면 없음", () => {
    expect(getRealtimeInquiryIdx(inquiry({ status: "waiting" }))).toBeNull();
    expect(getRealtimeInquiryIdx(inquiry({ status: "done" }))).toBeNull();
    expect(getRealtimeInquiryIdx(inquiry({ source: "qna" }))).toBeNull();
    expect(
      getRealtimeInquiryIdx(inquiry({ source: "campaignQna" })),
    ).toBeNull();
  });
});

describe("isOpenedByUser", () => {
  it("사용자가 직접 연 표시가 있을 때만 참", () => {
    expect(isOpenedByUser(OPENED_BY_USER_STATE)).toBe(true);
    expect(isOpenedByUser(null)).toBe(false);
    expect(isOpenedByUser(undefined)).toBe(false);
    expect(isOpenedByUser({ openedByUser: false })).toBe(false);
  });
});
