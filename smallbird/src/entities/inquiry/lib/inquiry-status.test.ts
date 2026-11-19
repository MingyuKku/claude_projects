import {
  isRealtimeInquiryStatus,
  matchesInquiryStatusFilter,
} from "./inquiry-status";

describe("isRealtimeInquiryStatus", () => {
  it("상담 중과 상담 요청 중만 실시간으로 본다", () => {
    expect(isRealtimeInquiryStatus("consulting")).toBe(true);
    expect(isRealtimeInquiryStatus("requested")).toBe(true);
    expect(isRealtimeInquiryStatus("waiting")).toBe(false);
    expect(isRealtimeInquiryStatus("done")).toBe(false);
    expect(isRealtimeInquiryStatus("failed")).toBe(false);
    expect(isRealtimeInquiryStatus("unknown")).toBe(false);
  });
});

describe("matchesInquiryStatusFilter", () => {
  it("전체 탭은 모두, 상담 중 탭은 상담 요청 중도 함께 보인다", () => {
    expect(matchesInquiryStatusFilter("unknown", "all")).toBe(true);
    expect(matchesInquiryStatusFilter("requested", "consulting")).toBe(true);
    expect(matchesInquiryStatusFilter("consulting", "consulting")).toBe(true);
    expect(matchesInquiryStatusFilter("waiting", "consulting")).toBe(false);
  });

  it("그 밖의 탭은 같은 상태만 보인다", () => {
    expect(matchesInquiryStatusFilter("waiting", "waiting")).toBe(true);
    expect(matchesInquiryStatusFilter("requested", "waiting")).toBe(false);
    expect(matchesInquiryStatusFilter("done", "done")).toBe(true);
    expect(matchesInquiryStatusFilter("requested", "done")).toBe(false);
  });
});
