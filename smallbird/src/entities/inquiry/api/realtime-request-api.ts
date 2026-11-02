import { ApiError, serverApiV3 } from "@/shared/api";

import { createInquiryThreadResultSchema } from "../model/schema";

/**
 * 실시간 상담 요청의 REST 쪽 생성(`isBoardType: false`). 상담 대화는 Firestore에 있어서 이 응답의
 * `sequence`·`threadIdx`로 상담 문서를 만듦. 기타 문의는 `campaignIdx`가 null.
 */
export async function createRealtimeThread(campaignIdx: number | null) {
  const response = await serverApiV3.post("/help/thread", {
    isBoardType: false,
    campaignIdx,
  });
  const parsed = createInquiryThreadResultSchema.parse(response);
  if (!parsed.result) throw new ApiError(200, parsed);
  return parsed.data;
}
