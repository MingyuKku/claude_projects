import { isProposalStatus } from "../model/proposal";

import type { CampaignProposalList } from "../model/proposal";
import type { ProposalListResponse } from "../model/proposal-schema";

export function transformProposalList(
  response: ProposalListResponse,
): CampaignProposalList {
  return {
    items: response.data.map((item) => ({
      proposalIdx: item.proposalIdx,
      platformIdx: item.platformIdx,
      handle: item.platformId,
      nickname: item.nickname,
      profileImageUrl: item.profileImageUrl,
      status: isProposalStatus(item.status) ? item.status : null,
      rawStatus: item.status,
      awaitingResponseFrom: item.awaitingResponseFrom,
      amount: item.amount,
      responseDeadline: item.responseDeadline,
      lastMessageAt: item.lastMessageAt,
    })),
    counts: response.counts,
    needsAttention: response.needsAttention,
  };
}
