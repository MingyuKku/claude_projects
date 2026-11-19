import { isRealtimeInquiryStatus } from "@/entities/inquiry";

import type { BuyerInquiryViewModel } from "@/entities/inquiry";

/**
 * 열어 둔 문의가 실시간 상담 중이면 종료 API에 넘길 문의 번호(= 스레드 번호), 아니면 null.
 * 목록은 캠페인+상대당 가장 최근 스레드만 주고 상태는 서버가 계산하므로(요청 중이면 REQUESTED, 상담 중이면 IN_PROGRESS) 행의 상태를 그대로 믿음.
 * 상품·캠페인 Q&A에는 실시간이 없음.
 */
export function getRealtimeInquiryIdx(inquiry: BuyerInquiryViewModel) {
  const isThreadSource =
    inquiry.source === "purchaser" || inquiry.source === "creator";
  return isThreadSource && isRealtimeInquiryStatus(inquiry.status)
    ? inquiry.inquiryIdx
    : null;
}
