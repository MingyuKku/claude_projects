import { useEffect, useMemo, useState } from "react";

import {
  applyRealtimeConsultation,
  getConnectDeadline,
} from "../lib/realtime-phase";
import {
  useAccountResponseAt,
  useRealtimeConsultationStates,
} from "./realtime-consultation-api";

import type { BigbirdInquiryViewModel } from "../model/schema";

/**
 * REST 목록에 실시간 상담의 연결·종료 상태(Firestore)를 합침. 종료되지 않은 실시간 상담만 구독하고,
 * 연결 대기 5분이 지나는 순간 화면을 다시 계산해 "요청 실패"로 바꿈.
 */
export function useLiveInquiries(
  threadUserIdx: number | undefined,
  inquiries: BigbirdInquiryViewModel[] | undefined,
) {
  const targets = useMemo(
    () =>
      (inquiries ?? [])
        .filter((inquiry) => inquiry.isRealtime && !inquiry.isFinished)
        .map(({ sequence, threadIdx }) => ({ sequence, threadIdx })),
    [inquiries],
  );
  const consultations = useRealtimeConsultationStates(
    threadUserIdx ?? 0,
    threadUserIdx === undefined ? [] : targets,
  );
  // 연결 판단은 내 계정 문서의 `msgResponseDate`로 함(realtime-phase.ts).
  const responseAt = useAccountResponseAt(
    threadUserIdx ?? 0,
    threadUserIdx !== undefined && targets.length > 0,
  );
  const [now, setNow] = useState(() => Date.now());

  const live = useMemo(
    () =>
      inquiries?.map((inquiry) =>
        applyRealtimeConsultation(
          inquiry,
          consultations[inquiry.threadIdx],
          now,
          responseAt,
        ),
      ),
    [inquiries, consultations, now, responseAt],
  );

  // 연결 대기 중인 상담의 마감 시각에 한 번 깨움. 지나면 그 상담은 실패가 되어 다음 마감으로 넘어감.
  const deadline = useMemo(() => {
    const deadlines = (live ?? [])
      .map(getConnectDeadline)
      .filter((value): value is number => value !== null);
    return deadlines.length ? Math.min(...deadlines) : null;
  }, [live]);
  useEffect(() => {
    if (deadline === null) return;
    const timer = setTimeout(
      () => setNow(Date.now()),
      Math.max(0, deadline - Date.now()),
    );
    return () => clearTimeout(timer);
  }, [deadline]);

  return live;
}
