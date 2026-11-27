/** 제안 상태(서버 코드). `CONTENT_CONFIRM`은 아직 쓰이지 않는 값이라 모르는 값과 같이 다룸. */
export const PROPOSAL_STATUSES = [
  "PROPOSED",
  "NEGOTIATING",
  "ACCEPTED",
  "PAID",
  "REJECTED",
  "EXPIRED",
] as const;
export type ProposalStatus = (typeof PROPOSAL_STATUSES)[number];

export function isProposalStatus(value: string): value is ProposalStatus {
  return PROPOSAL_STATUSES.some((status) => status === value);
}

/** 매칭 목록 한 줄. 상태가 모르는 값이면 `status`가 null이고 `rawStatus`를 그대로 보임. */
export interface CampaignProposal {
  proposalIdx: number;
  platformIdx: number;
  handle: string;
  nickname: string | null;
  profileImageUrl: string | null;
  status: ProposalStatus | null;
  rawStatus: string;
  /** 제안 중·재협상일 때 응답할 차례인 쪽. 그 밖의 상태는 null. */
  awaitingResponseFrom: "ADVERTISER" | "INFLUENCER" | null;
  amount: number;
  /** 지금 라운드의 응답 기한(ISO). 남은 시간 계산에 씀. */
  responseDeadline: string | null;
  /** 마지막 메시지·상태 변경 시각(ISO). "응답 일시" 칸. */
  lastMessageAt: string | null;
}

/** 상단 집계(필터와 무관하게 전체 기준). */
export interface ProposalCounts {
  total: number;
  proposed: number;
  negotiating: number;
  pendingPayment: number;
  matched: number;
  rejectedOrExpired: number;
}

export interface CampaignProposalList {
  items: CampaignProposal[];
  counts: ProposalCounts;
  needsAttention: boolean;
}

/** 크리에이터가 재협상을 요청해 광고주가 수락·거절·다시 제안할 차례. */
export function isAwaitingAdvertiser(proposal: CampaignProposal) {
  return (
    proposal.status === "NEGOTIATING" &&
    proposal.awaitingResponseFrom === "ADVERTISER"
  );
}

/** 화면 상태. 광고주가 다시 제안해 크리에이터 응답을 기다리는 재협상은 "제안 중"(REQ-14-0049). */
export function getDisplayStatus(proposal: CampaignProposal) {
  return proposal.status === "NEGOTIATING" &&
    proposal.awaitingResponseFrom === "INFLUENCER"
    ? "PROPOSED"
    : proposal.status;
}

/** 결제할 수 있는 줄(결제 대기). 결제 API는 하나라도 아니면 전체 실패라 이 줄만 고르게 함. */
export function isPayableProposal(proposal: CampaignProposal) {
  return proposal.status === "ACCEPTED";
}
