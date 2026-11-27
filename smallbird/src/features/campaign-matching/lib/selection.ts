import type { CampaignProposal } from "@/entities/campaign-progress";

/** 남은 시간을 보여 줄 상태(응답·결제를 기다리는 중). 매칭 완료·거절·만료는 "-". */
export function hasActiveDeadline(proposal: CampaignProposal) {
  return (
    proposal.status === "PROPOSED" ||
    proposal.status === "NEGOTIATING" ||
    proposal.status === "ACCEPTED"
  );
}

/** 목록 이름: 닉네임이 없으면 핸들(크롤링 데이터가 끊긴 경우 서버가 null을 줌). */
export function getProposalName(proposal: CampaignProposal) {
  return proposal.nickname ?? `@${proposal.handle}`;
}
