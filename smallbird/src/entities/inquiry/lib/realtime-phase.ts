import type {
  BigbirdInquiryStatus,
  BigbirdInquiryViewModel,
  RealtimeConsultation,
  RealtimePhase,
} from "../model/schema";

/** 상담 요청 뒤 운영자가 연결되기를 기다리는 시간(요구명세서 REQ-23-0020 3분). */
export const REALTIME_CONNECT_TIMEOUT_MS = 3 * 60 * 1000;

/**
 * 연결 뒤 상대 응답을 기다리는 시간(REQ-23-0021). 마지막 메시지 뒤 이만큼 지나면 안내하고, 두 번째 값이 지나면
 * 광고주 차례일 때는 자동 종료, 운영 차례일 때는 지연 안내만 함. 새 메시지가 오면 다시 셈.
 */
export const REALTIME_IDLE_WARNING_MS = 5 * 60 * 1000;
export const REALTIME_IDLE_LIMIT_MS = 10 * 60 * 1000;

/** Firestore에 쓰는 `YYYY-MM-DD HH:mm:ss`(로컬 시각)를 ms로. 비었거나 잘못된 값은 null. */
export function parseWriteTime(value: string | null | undefined) {
  if (!value) return null;
  const time = new Date(value.replace(" ", "T")).getTime();
  return Number.isNaN(time) ? null : time;
}

const PHASE_STATUS: Record<RealtimePhase, BigbirdInquiryStatus> = {
  requesting: "waiting",
  connected: "consulting",
  // 연결 실패 뒤에는 일반 문의로 이어가므로 답변 대기로 보임(사용자 결정 2026-10-29).
  failed: "waiting",
  finished: "done",
};

interface PhaseInput {
  isFinished: boolean;
  isConnect: boolean;
  /** 연결을 요청한 시각. */
  requestedAt: Date;
  now: number;
}

/**
 * 종료 여부(`finishTime`)가 먼저. `isConnect`는 종료 때 v2 광고주는 true, 운영 앱은 false를 쓰므로
 * 종료된 상담의 상태를 판정하는 데 쓰지 않음.
 *
 * ponytail: 요청 실패는 서버·Firestore에 저장되지 않아 "요청 시각 + 3분이 지나도 연결되지 않음"으로 계산함.
 * 재시도할 때 새 요청 시각을 담을 필드가 정해지면 `requestedAt`을 그 값으로 바꿈.
 */
export function getRealtimePhase({
  isFinished,
  isConnect,
  requestedAt,
  now,
}: PhaseInput): RealtimePhase {
  if (isFinished) return "finished";
  if (isConnect) return "connected";
  if (now - requestedAt.getTime() >= REALTIME_CONNECT_TIMEOUT_MS)
    return "failed";
  return "requesting";
}

/** 연결 대기가 끝나는 시각. 대기 중이 아니면 null. 이 시각에 화면을 다시 계산해야 함. */
export function getConnectDeadline(
  inquiry: Pick<
    BigbirdInquiryViewModel,
    "realtimePhase" | "createdAt" | "connectDeadlineAt"
  >,
): number | null {
  return inquiry.realtimePhase === "requesting"
    ? (inquiry.connectDeadlineAt ??
        inquiry.createdAt.getTime() + REALTIME_CONNECT_TIMEOUT_MS)
    : null;
}

// 캠페인 카드는 요청 때 쓰는 auto 메시지라 대화 차례 계산에서 뺌.
function isCampaignCardMessage(
  message: RealtimeConsultation["messages"][number],
) {
  return message.auto && message.body.trimStart().startsWith("{");
}

/**
 * 연결된 상담에서 지금 누구의 답을 기다리는지와 그 시작 시각. 마지막 메시지가 광고주 것이면 운영 차례,
 * 운영 것(연결 안내 포함)이면 광고주 차례. 메시지가 없으면 연결 시각(`seqResponseDate`)부터 광고주 차례.
 */
export function getIdleTurn(
  consultation: RealtimeConsultation,
): BigbirdInquiryViewModel["idleTurn"] {
  const last = consultation.messages
    .filter((message) => !isCampaignCardMessage(message))
    .at(-1);
  if (last) {
    const since = parseWriteTime(last.created);
    if (since === null) return null;
    return {
      waitingFor: last.isUserMessage ? "operator" : "advertiser",
      since,
    };
  }
  const connectedAt = parseWriteTime(consultation.seqResponseDate);
  return connectedAt === null
    ? null
    : { waitingFor: "advertiser", since: connectedAt };
}

/**
 * REST 문의에 Firestore 상담 문서의 진행 상태를 합침. 문서를 아직 받지 못했고 종료되지도 않았다면
 * 연결됐는지 알 수 없어 그대로 둠(상태를 추측하지 않음).
 */
export function applyRealtimeConsultation(
  inquiry: BigbirdInquiryViewModel,
  consultation: RealtimeConsultation | undefined,
  now: number,
): BigbirdInquiryViewModel {
  if (!inquiry.isRealtime) return inquiry;
  if (!consultation && !inquiry.isFinished) return inquiry;
  // 재시도하면 `waitDeadline`이 새로 써지므로 REST의 생성 시각보다 우선함.
  const deadline = parseWriteTime(consultation?.waitDeadline);
  const requestedAt =
    deadline === null
      ? inquiry.createdAt
      : new Date(deadline - REALTIME_CONNECT_TIMEOUT_MS);
  const isFinished = inquiry.isFinished || consultation?.finishTime != null;
  const isConnect = consultation?.isConnect ?? false;
  // 취소·만료가 기록된 요청은 마감 시각 전에도 실패.
  const isDead =
    !isFinished &&
    !isConnect &&
    Boolean(consultation?.canceledAt || consultation?.expiredAt);
  const phase = isDead
    ? "failed"
    : getRealtimePhase({ isFinished, isConnect, requestedAt, now });
  return {
    ...inquiry,
    realtimePhase: phase,
    isFinished: phase === "finished",
    status: PHASE_STATUS[phase],
    connectDeadlineAt: requestedAt.getTime() + REALTIME_CONNECT_TIMEOUT_MS,
    idleTurn:
      phase === "connected" && consultation ? getIdleTurn(consultation) : null,
    isRetryable: phase === "failed" && !consultation?.canceledAt,
  };
}
