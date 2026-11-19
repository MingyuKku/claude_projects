import { getRealtimeInquiryIdx } from "./realtime-inquiry-idx";

import type { BuyerInquiryViewModel } from "@/entities/inquiry";

const inquiry = (over: Partial<BuyerInquiryViewModel>) =>
  ({
    inquiryIdx: 2100,
    source: "purchaser",
    status: "consulting",
    ...over,
  }) as BuyerInquiryViewModel;

describe("getRealtimeInquiryIdx", () => {
  it("구매자·크리에이터 문의가 상담 중이면 그 문의 번호", () => {
    expect(getRealtimeInquiryIdx(inquiry({}))).toBe(2100);
    expect(getRealtimeInquiryIdx(inquiry({ source: "creator" }))).toBe(2100);
  });

  it("실시간 상담 요청 중(상담원 수락 전)에도 그 문의 번호", () => {
    expect(getRealtimeInquiryIdx(inquiry({ status: "requested" }))).toBe(2100);
  });

  it("상담 중이 아니거나 Q&A면 없음", () => {
    expect(getRealtimeInquiryIdx(inquiry({ status: "waiting" }))).toBeNull();
    expect(getRealtimeInquiryIdx(inquiry({ status: "done" }))).toBeNull();
    expect(getRealtimeInquiryIdx(inquiry({ status: "unknown" }))).toBeNull();
    expect(getRealtimeInquiryIdx(inquiry({ source: "qna" }))).toBeNull();
    expect(
      getRealtimeInquiryIdx(inquiry({ source: "campaignQna" })),
    ).toBeNull();
  });
});
