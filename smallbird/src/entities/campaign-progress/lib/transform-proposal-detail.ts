import { isProposalStatus } from "../model/proposal";

import type {
  ProposalConversation,
  ProposalInfo,
} from "../model/proposal-detail";
import type {
  ProposalInfoResponse,
  ProposalMessagesResponse,
} from "../model/proposal-detail-schema";

export function transformProposalConversation(
  response: ProposalMessagesResponse,
): ProposalConversation {
  const card = response.proposalCard;
  return {
    messages: response.messages
      .filter((message) => message.deleteTime === null)
      .map((message, index) => ({
        key: String(message.messageIdx ?? `i${index}`),
        body: message.body,
        isMine: message.isUserMessage,
        writtenAt: message.writeTime,
      })),
    offer: card && {
      campaignName: card.campaignName,
      campaignType: card.campaignType,
      status: isProposalStatus(card.status) ? card.status : null,
      round: card.currentRound,
      amount: card.currentAmount,
      groupBuyFeeRate: card.groupBuyFeeRate,
      uploadScheduleStart: card.uploadScheduleStart,
      uploadScheduleEnd: card.uploadScheduleEnd,
    },
  };
}

export function transformProposalInfo(
  response: ProposalInfoResponse,
): ProposalInfo {
  const { influencer, campaign, offer } = response;
  return {
    creator: {
      platformIdx: influencer.platformIdx,
      handle: influencer.platformId,
      nickname: influencer.nickname,
      profileImageUrl: influencer.profileImageUrl,
    },
    campaign: {
      name: campaign.campaignName,
      type: campaign.campaignType,
      progressStatus: campaign.progressStatus,
      startDate: campaign.progressStartDate,
      endDate: campaign.progressEndDate,
      code: campaign.campaignCode,
    },
    offer: {
      initialAmount: offer.initialAmount,
      currentAmount: offer.currentAmount,
      uploadScheduleStart: offer.uploadScheduleStart,
      uploadScheduleEnd: offer.uploadScheduleEnd,
    },
    memo: response.memo ?? "",
  };
}
