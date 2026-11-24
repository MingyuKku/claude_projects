import { Plus } from "lucide-react";
import { useState } from "react";
import { useNavigate, useOutletContext } from "react-router";
import { toast } from "sonner";

import {
  getCampaignDetailPath,
  getCampaignRegisterPath,
  useCampaignPage,
  useCampaignScrollList,
} from "@/entities/campaign";
import { getSubscribedTypes, useSubscriptions } from "@/entities/subscription";
import { EmptyState } from "@/shared/components/empty-state";
import {
  FilterToolbar,
  hasActiveFilter,
  ListEmptyState,
  resolveEmptyKind,
} from "@/shared/components/list-filter";
import { MEDIA_QUERY, ROUTES } from "@/shared/config";
import { useTranslation } from "@/shared/i18n";
import { useMediaQuery } from "@/shared/lib";
import { Button } from "@/shared/ui/button";

import { isSubscriptionExpiredForWrite } from "../lib/subscription-guard";
import { TAB_STAGES } from "../model/constants";
import { useStatusParams } from "../model/use-status-params";
import { CampaignListSection } from "./CampaignListSection";
import { StatusTabs } from "./StatusTabs";
import { SubscriptionRequiredDialog } from "./SubscriptionRequiredDialog";

import type { ShortcutKind } from "../lib/campaign-actions";
import type { CampaignSummary } from "@/entities/campaign";
import type { SessionViewModel } from "@/entities/session";
import type { ReactNode } from "react";

// 캠페인 현황: 진행 단계 탭·검색·유형 필터·표(PC)/카드(TAB·MO). 탭·검색·유형·쪽은 주소 쿼리가 소유함.
// 셸(헤더·LNB)은 app 레이어의 CampaignLayout이 감쌈.
export function CampaignStatusPage() {
  const { t } = useTranslation("pages/campaign-status");
  const { t: tCommon } = useTranslation();
  const navigate = useNavigate();
  const session = useOutletContext<SessionViewModel>();
  const isTabletUp = useMediaQuery(MEDIA_QUERY.tabletUp);
  const isDesktop = useMediaQuery(MEDIA_QUERY.desktop);
  const params = useStatusParams();
  const paged = useCampaignPage(
    isTabletUp ? { ...params.baseQuery, page: params.page } : null,
  );
  const scroll = useCampaignScrollList(params.baseQuery, !isTabletUp);

  // 할당된 Sub ID는 "+ 캠페인 등록하기"·"작성하기"·삭제를 쓰지 못함(스펙 P-3).
  const isSubAccount = session.authority === "SUB";
  const [isSubscribeAlertOpen, setIsSubscribeAlertOpen] = useState(false);
  // Sub ID는 구독 API가 403이라 읽지 않음("작성하기"도 못 씀).
  const subscriptions = useSubscriptions({ isEnabled: !isSubAccount });
  const subscribedTypes = subscriptions.data
    ? getSubscribedTypes(subscriptions.data)
    : null;
  // 모든 탭에서 유지함
  const canRegister = !isSubAccount;

  function handleClickRegister() {
    void navigate(ROUTES.campaignCreate);
  }

  // 캠페인 관리·결과 확인이 갈 진행 화면은 아직 없어 "준비 중" 토스트.
  function handleClickShortcut(campaign: CampaignSummary, kind: ShortcutKind) {
    switch (kind) {
      case "write":
        if (isSubscriptionExpiredForWrite(campaign, subscribedTypes)) {
          setIsSubscribeAlertOpen(true);
          return;
        }
        void navigate(getCampaignRegisterPath(campaign.campaignIdx));
        return;
      case "detail":
      case "rejectReason":
        void navigate(getCampaignDetailPath(campaign.campaignIdx));
        return;
      default:
        toast(tCommon("status.comingSoon"));
    }
  }

  function handleClickDetail(campaign: CampaignSummary) {
    void navigate(getCampaignDetailPath(campaign.campaignIdx));
  }

  function handleReload() {
    void (isTabletUp ? paged.mutate() : scroll.reload());
  }

  function handleRefresh() {
    params.reset();
    handleReload();
  }

  const emptyKind = resolveEmptyKind(
    params.keyword,
    hasActiveFilter(params.filters),
  );
  // 계정에 캠페인이 하나도 없음: 조건 없는 전체 탭이 0건.
  const isAccountEmpty = emptyKind === "none" && params.tab === "all";
  // 검색·필터 결과가 0건이면 계정에 캠페인이 있는지 조건 없는 전체 목록으로 확인함(시안이 두 경우의 문구를 나눔).
  const listTotalCount = isTabletUp
    ? paged.list?.totalCount
    : scroll.isLoading
      ? undefined
      : scroll.totalCount;
  const needsAccountCheck =
    params.tab === "all" && emptyKind !== "none" && listTotalCount === 0;
  const accountList = useCampaignPage(
    needsAccountCheck
      ? { statuses: TAB_STAGES.all, type: null, keyword: "", page: 1 }
      : null,
  );
  const isNoCampaignAccount =
    needsAccountCheck && accountList.list?.totalCount === 0;
  const emptyFillClassName = "flex-1 py-10";

  let emptyContent: ReactNode;
  if (isAccountEmpty) {
    emptyContent = (
      <EmptyState
        type="start"
        title={t("empty.account.title")}
        className={emptyFillClassName}
      />
    );
  } else if (isNoCampaignAccount) {
    emptyContent = (
      <EmptyState
        type="no-list"
        title={t("empty.account.searchNoCampaign")}
        className={emptyFillClassName}
      />
    );
  } else if (needsAccountCheck && accountList.isLoading) {
    emptyContent = <div className={emptyFillClassName} />;
  } else {
    emptyContent = (
      <ListEmptyState
        kind={emptyKind}
        keyword={params.keyword}
        noneTitle={t(`empty.tab.${params.tab}`)}
        height="fill"
      />
    );
  }

  const registerButton = canRegister && (
    <Button onClick={handleClickRegister}>
      <Plus aria-hidden />
      {t(isTabletUp ? "action.register" : "action.registerShort")}
    </Button>
  );

  return (
    <div className="flex min-h-full flex-col">
      <div className="ds-px-5 pt-2">
        <StatusTabs value={params.tab} onChange={params.setTab} />
      </div>
      <div className="flex flex-1 flex-col gap-4 ds-px-5 ds-pt-6 ds-pb-5 desktop:gap-3">
        {!isTabletUp && registerButton}
        <FilterToolbar
          fields={params.fields}
          values={params.filters}
          onChangeValues={params.setFilters}
          onApplyFromDialog={params.applyFiltersAndClosePanel}
          onRefresh={handleRefresh}
          isSearchInline
          endAction={isTabletUp ? registerButton : undefined}
          search={{ keyword: params.keyword, onSubmit: params.setKeyword }}
        />
        <CampaignListSection
          params={params}
          isTabletUp={isTabletUp}
          isDesktop={isDesktop}
          paged={paged}
          scroll={scroll}
          emptyContent={emptyContent}
          isSubAccount={isSubAccount}
          onClickShortcut={handleClickShortcut}
          onClickDetail={handleClickDetail}
          onDeleted={handleReload}
        />
      </div>
      <SubscriptionRequiredDialog
        open={isSubscribeAlertOpen}
        onClose={() => setIsSubscribeAlertOpen(false)}
        onSubscribe={() => void navigate(ROUTES.mypageSubscribe)}
      />
    </div>
  );
}
