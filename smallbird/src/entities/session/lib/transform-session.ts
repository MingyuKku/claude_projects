import type {
  MenuPermissions,
  Session,
  SessionViewModel,
} from "../model/schema";

const ALL_PERMISSIONS: MenuPermissions = {
  campaign: true,
  influencerMatching: true,
  influencerMarket: true,
  commerce: true,
  bigbirdMoney: true,
  purchaserQuestion: true,
  influencerQuestion: true,
};

function toMenuPermissions(session: Session): MenuPermissions {
  if (session.authority !== "SUB") return ALL_PERMISSIONS;
  return {
    campaign: session.isCampaignAccess ?? false,
    influencerMatching: session.isInfluencerMatchingAccess ?? false,
    influencerMarket: session.isInfluencerMarketAccess ?? false,
    commerce: session.isCommerceAccess ?? false,
    bigbirdMoney: session.isBigbirdMoneyAccess ?? false,
    purchaserQuestion: session.isPurchaserQuestionAccess ?? false,
    influencerQuestion: session.isInfluencerQuestionAccess ?? false,
  };
}

export function transformSessionToViewModel(
  session: Session,
): SessionViewModel {
  return {
    isAllowed: session.result,
    userIdx: session.userIdx,
    accountIdx: session.accountIdx,
    threadUserIdx: session.threadUserIdx,
    authority: session.authority,
    service: session.service,
    displayName: session.nickname ?? session.identifier,
    identifier: session.identifier,
    email: session.email,
    phone: session.phone,
    permissions: toMenuPermissions(session),
  };
}
