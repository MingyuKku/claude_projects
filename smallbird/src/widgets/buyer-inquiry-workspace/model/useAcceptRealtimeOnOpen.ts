import { useEffect } from "react";

import { acceptRealtimeRequest } from "@/entities/inquiry";

import type { BuyerInquiryViewModel } from "@/entities/inquiry";

// 이번 페이지에서 수락을 보낸 상담(`{threadUserIdx}:{sequence}`). 다시 열거나 다시 렌더링돼도 한 번만 씀.
// 트랜잭션도 이미 연결된 상담은 건너뛰므로 여기는 읽기를 줄이는 용도.
const attempted = new Set<string>();

/**
 * 구매자 실시간 상담을 광고주가 열면 바로 수락함(운영 v3와 같음, 사용자 결정 2026-11-02). 탭이 가려진 채
 * 열렸으면 보이게 될 때 수락함. 거절(취소·만료·종료·마감 지남)은 다시 시도하지 않고, 통신 오류만 다음에 다시 시도함.
 */
export function useAcceptRealtimeOnOpen(
  inquiry: BuyerInquiryViewModel,
  realtimeThread: { threadIdx: number; sequence: number } | null,
  identifier: string | null,
) {
  const { threadUserIdx } = inquiry;
  const sequence = realtimeThread?.sequence;
  const threadIdx = realtimeThread?.threadIdx;

  useEffect(() => {
    if (threadUserIdx === null || sequence === undefined) return;
    const key = `${threadUserIdx}:${sequence}`;
    const target = { threadUserIdx, sequence };

    function accept() {
      if (document.hidden || attempted.has(key)) return;
      attempted.add(key);
      acceptRealtimeRequest(target, identifier)
        .then((result) => {
          // 문서가 REST 스레드보다 늦게 생기면 missing. 다음에 탭이 보이게 되거나 첫 전송 때 다시 시도함.
          if (!result.ok && result.reason === "missing") attempted.delete(key);
        })
        .catch((error: unknown) => {
          attempted.delete(key);
          console.error("구매자 실시간 상담 수락 실패", error);
        });
    }

    accept();
    document.addEventListener("visibilitychange", accept);
    return () => document.removeEventListener("visibilitychange", accept);
  }, [threadUserIdx, sequence, threadIdx, identifier]);
}
