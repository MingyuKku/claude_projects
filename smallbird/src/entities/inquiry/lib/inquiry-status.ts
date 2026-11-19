import type { BigbirdInquiryStatus, BuyerInquiryStatus } from "../model/schema";

/**
 * 실시간 상담이 요청됐거나 진행 중인 상태. 서버는 상담원이 수락하기 전을 REQUESTED, 수락한 뒤를 IN_PROGRESS로 주며,
 * 둘 다 같은 상담 문서·같은 종료 흐름을 씀.
 */
export function isRealtimeInquiryStatus(
  status: BuyerInquiryStatus | BigbirdInquiryStatus,
) {
  return status === "consulting" || status === "requested";
}

/**
 * 상태 탭에 맞는 문의인지. "상담 중" 탭은 서버가 REQUESTED와 IN_PROGRESS를 함께 내려 주므로 둘 다 맞는 것으로 봄.
 */
export function matchesInquiryStatusFilter(
  status: BuyerInquiryStatus | BigbirdInquiryStatus,
  filter: "all" | "waiting" | "consulting" | "done",
) {
  if (filter === "all") return true;
  return filter === "consulting"
    ? isRealtimeInquiryStatus(status)
    : status === filter;
}
