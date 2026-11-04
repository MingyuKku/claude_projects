import { useEffect, useRef } from "react";

import { isConsultationConnected } from "../lib/realtime-phase";
import { usePurchaserConversation } from "./inquiry-api";
import { useConsultationDocument } from "./realtime-consultation-api";

import type { BuyerInquiryViewModel } from "../model/schema";

/** 실시간 요청을 받은 상담의 연결 상태. `unknown`은 상담 문서를 아직 못 받은 중. */
export type ConsultationConnection =
  "unknown" | "waiting" | "connected" | "missing";

/**
 * 구매자·인플루언서 문의에서 상담 중(실시간)인 행의 상담 문서(`threadUserIdx/{상대}/sequence/{sequence}`)를 구독함.
 * 문서가 바뀌면 대화(타임라인 REST)를 다시 받고, 연결·종료가 바뀌면 `onChanged`로 목록도 다시 받게 함. 연결 여부는 문서의
 * `acceptedAt`으로 판단함(가이드 2026-11-03). 상담 중이 아니거나 목록 행에 `sequence`가 없으면(서버 반영 전) 구독하지 않고
 * `missing`임. 화면 하나에서 한 번만 부르면 됨.
 */
export function useConsultationSync(
  inquiry: BuyerInquiryViewModel,
  onChanged?: () => void,
) {
  const { threadUserIdx, sequence, source, status, inquiryIdx } = inquiry;
  const { mutate } = usePurchaserConversation(inquiry);
  const isThreadSource = source === "purchaser" || source === "influencer";
  const isEnabled =
    isThreadSource &&
    status === "consulting" &&
    threadUserIdx !== null &&
    sequence !== null;
  const { consultation, isLoading, isError, isOtherDevice } =
    useConsultationDocument(
      threadUserIdx ?? 0,
      isEnabled ? (sequence ?? undefined) : undefined,
      inquiryIdx,
    );

  const last = consultation?.messages.at(-1);
  const signature = consultation
    ? [consultation.messages.length, last?.created, last?.messageId].join("|")
    : undefined;
  const stateSignature = consultation
    ? [consultation.finishTime, consultation.acceptedAt].join("|")
    : undefined;
  const previous = useRef<{ messages?: string; state?: string }>({});
  const onChangedRef = useRef(onChanged);
  useEffect(() => {
    onChangedRef.current = onChanged;
  });
  useEffect(() => {
    // 처음 받은 값은 이미 화면에 있으므로 다시 받지 않고, 그 뒤 바뀔 때만 다시 받음.
    const before = previous.current;
    previous.current = { messages: signature, state: stateSignature };
    if (before.messages !== undefined && before.messages !== signature)
      void mutate();
    if (before.state !== undefined && before.state !== stateSignature)
      onChangedRef.current?.();
  }, [signature, stateSignature, mutate]);

  let connection: ConsultationConnection = "missing";
  if (isEnabled && consultation)
    connection = isConsultationConnected(consultation)
      ? "connected"
      : "waiting";
  else if (isEnabled && isLoading) connection = "unknown";
  return { connection, isOtherDevice: isEnabled && isOtherDevice, isError };
}
