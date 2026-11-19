import type {
  MenuPermissions,
  Session,
  SessionViewModel,
} from "../model/schema";

const ALL_PERMISSIONS: MenuPermissions = {
  campaign: true,
  creatorMatching: true,
  creatorMarket: true,
  commerce: true,
  bigbirdMoney: true,
  purchaserQuestion: true,
  creatorQuestion: true,
};

function toMenuPermissions(session: Session): MenuPermissions {
  if (session.authority !== "SUB") return ALL_PERMISSIONS;
  return {
    campaign: session.isCampaignAccess ?? false,
    creatorMatching: session.isInfluencerMatchingAccess ?? false,
    creatorMarket: session.isInfluencerMarketAccess ?? false,
    commerce: session.isCommerceAccess ?? false,
    bigbirdMoney: session.isBigbirdMoneyAccess ?? false,
    purchaserQuestion: session.isPurchaserQuestionAccess ?? false,
    creatorQuestion: session.isInfluencerQuestionAccess ?? false,
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
    profileImageUrl: session.profileImageUrl || null,
    permissions: toMenuPermissions(session),
  };
}
