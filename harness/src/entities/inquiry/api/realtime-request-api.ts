import { ApiError, deviceHeaders, serverApiV3 } from "@/shared/api";

import { createInquiryThreadResultSchema } from "../model/schema";

/**
 * 열린 문의가 없을 때의 실시간 상담 요청: 새 스레드를 실시간 모드로 만듦(`POST /v3/help/thread`, `isBoardType: false`).
 * 상담 문서는 서버가 씀. 기타 문의는 `campaignIdx`가 null.
 */
export async function createRealtimeThread(campaignIdx: number | null) {
  const response = await serverApiV3.post(
    "/help/thread",
    { isBoardType: false, campaignIdx },
    { headers: deviceHeaders() },
  );
  const parsed = createInquiryThreadResultSchema.parse(response);
  if (!parsed.result) throw new ApiError(200, parsed);
  return parsed.data;
}

/**
 * 열린 빅버드 문의(기타 문의 포함)를 같은 스레드에서 실시간으로 바꿈(`PUT /v3/help/thread/{threadIdx}/realtime`).
 * 종료된 기타 문의는 서버가 새 스레드를 만들어 새 `threadIdx`·`sequence`를 주므로 응답 값으로 갈아타야 함(캠페인 문의는 같은 스레드를
 * 재오픈). 다른 기기가 방을 쥐고 있으면 409.
 */
export async function startThreadRealtime(threadIdx: number) {
  const response = await serverApiV3.put(
    `/help/thread/${threadIdx}/realtime`,
    undefined,
    { headers: deviceHeaders() },
  );
  // 응답은 문의 생성과 같은 ThreadCreateV3Response `{result, data:{sequence, threadIdx}}`(stage Swagger 2026-11-04 10:15).
  const parsed = createInquiryThreadResultSchema.parse(response);
  if (!parsed.result) throw new ApiError(200, parsed);
  return parsed.data;
}
