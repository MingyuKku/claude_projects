import { serverApiV3 } from "@/shared/api";

import {
  transformProposalConversation,
  transformProposalInfo,
} from "../lib/transform-proposal-detail";
import {
  proposalInfoSchema,
  proposalMessagesSchema,
} from "../model/proposal-detail-schema";

const proposalPath = (proposalIdx: number, path: string) =>
  `/matching/influencer/proposal/${proposalIdx}${path}`;

/** 대화 전체와 지금 라운드 제안 카드. 읽으면 서버가 크리에이터 메시지를 읽음 처리함. */
export async function fetchProposalConversation(proposalIdx: number) {
  return transformProposalConversation(
    proposalMessagesSchema.parse(
      await serverApiV3.get(proposalPath(proposalIdx, "/messages")),
    ),
  );
}

export async function fetchProposalInfo(proposalIdx: number) {
  return transformProposalInfo(
    proposalInfoSchema.parse(
      await serverApiV3.get(proposalPath(proposalIdx, "/info")),
    ),
  );
}

// 수락·거절·다시 제안은 응답(새 라운드)을 쓰지 않고 목록·대화를 다시 읽음.
export async function acceptProposal(proposalIdx: number) {
  await serverApiV3.put(proposalPath(proposalIdx, "/accept"));
}

export async function rejectProposal(proposalIdx: number) {
  await serverApiV3.put(proposalPath(proposalIdx, "/reject"));
}

/** 금액만 다시 제안함. 희망 업로드 일정은 보내지 않아 이전 라운드 값이 유지됨. */
export async function counterProposal(proposalIdx: number, amount: number) {
  await serverApiV3.put(proposalPath(proposalIdx, "/counter"), { amount });
}

/** 메모 전체를 덮어씀(서버 최대 2000자). */
export async function saveProposalMemo(proposalIdx: number, memo: string) {
  await serverApiV3.put(proposalPath(proposalIdx, "/memo"), {
    memo: memo || null,
  });
}
