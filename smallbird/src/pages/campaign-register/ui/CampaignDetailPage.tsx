import { useOutletContext, useParams } from "react-router";

import {
  parseCampaignIdx,
  isUnreadableCampaignError,
  useCampaignDetail,
} from "@/entities/campaign";
import { getSubscribedTypes, useSubscriptions } from "@/entities/subscription";
import {
  CampaignDetailContent,
  CampaignDetailSidebar,
} from "@/features/register-campaign";
import { NotFoundError } from "@/shared/lib";

import { RegisterShell } from "./RegisterShell";

import type { SessionViewModel } from "@/entities/session";

export function CampaignDetailPage() {
  const { campaignIdx: campaignIdxParam } = useParams();
  const campaignIdx = parseCampaignIdx(campaignIdxParam);
  const session = useOutletContext<SessionViewModel>();
  const { detail, error } = useCampaignDetail(campaignIdx, {
    isFilledByLoader: true,
  });
  // 구독 상태가 바뀌었을 수 있어 들어올 때마다 다시 읽음.
  const subscriptions = useSubscriptions({
    isEnabled: Boolean(detail?.isDemo),
  });

  if (campaignIdx === null) throw new NotFoundError();
  if (error) {
    if (isUnreadableCampaignError(error)) throw new NotFoundError();
    throw error;
  }
  if (!detail) return <RegisterShell />;

  const canManage = session.authority !== "SUB";
  const isPickSubscribed = subscriptions.data
    ? getSubscribedTypes(subscriptions.data).has("pick")
    : null;

  return (
    <RegisterShell
      isDemo={detail.isDemo}
      sidebar={<CampaignDetailSidebar detail={detail} canManage={canManage} />}
    >
      <CampaignDetailContent
        detail={detail}
        canManage={canManage}
        isPickSubscribed={isPickSubscribed}
      />
    </RegisterShell>
  );
}
