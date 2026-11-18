import { deriveRealtimeLines } from "../lib/realtime-session-lines";
import { useConsultationDocument } from "./realtime-consultation-api";

import type { BuyerInquiryViewModel } from "../model/schema";

/**
 * 구매자·인플루언서 문의 대화에 그릴 실시간 상담의 시작·종료 줄. REST 대화에는 요청·종료 안내(auto)가 없고 상담 문서에만
 * 있어서, 끝난 상담도 문서를 읽음(구독 key가 같아 `useConsultationSync`의 구독과 하나로 합쳐짐). `isEnabled`가 꺼져 있거나
 * 목록 행에 `sequence`가 없으면(서버 반영 전) 읽지 않고 줄도 없음.
 */
export function useRealtimeSessionLines(
  inquiry: BuyerInquiryViewModel,
  isEnabled: boolean,
) {
  const { threadUserIdx, sequence, inquiryIdx } = inquiry;
  const { consultation } = useConsultationDocument(
    threadUserIdx ?? 0,
    isEnabled && threadUserIdx !== null && sequence !== null
      ? sequence
      : undefined,
    inquiryIdx,
  );
  return consultation ? deriveRealtimeLines(consultation) : [];
}
