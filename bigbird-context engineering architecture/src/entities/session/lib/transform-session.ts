import type {
  Session,
  SessionViewModel,
  SubPermissions,
} from "../model/schema";

const ALL_PERMISSIONS: SubPermissions = {
  requestCampaign: true,
  openShop: true,
  currentSituation: true,
  settlement: true,
  customerService: true,
};

function toSubPermissions(session: Session): SubPermissions {
  if (session.authority !== "SUB") return ALL_PERMISSIONS;
  return {
    requestCampaign: session.isRequestCampaignAccess ?? false,
    openShop: session.isOpenShopAccess ?? false,
    currentSituation: session.isCurrentSituationAccess ?? false,
    settlement: session.isSettlementAccess ?? false,
    customerService: session.isCustomerServiceAccess ?? false,
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
    subPermissions: toSubPermissions(session),
  };
}
