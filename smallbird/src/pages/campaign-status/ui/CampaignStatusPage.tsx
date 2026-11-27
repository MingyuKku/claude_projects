import { Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { useLocation, useNavigate, useOutletContext } from "react-router";
import { toast } from "sonner";

import {
  getCampaignDetailPath,
  getCampaignProgressPath,
  getCampaignRegisterPath,
  useCampaignPage,
  useCampaignScrollList,
  useCampaignStatusReturnStore,
} from "@/entities/campaign";
import { getSubscribedTypes, useSubscriptions } from "@/entities/subscription";
import { EmptyState } from "@/shared/components/empty-state";
import {
  FilterToolbar,
  hasActiveFilter,
  ListEmptyState,
  resolveEmptyKind,
} from "@/shared/components/list-filter";
import { FILTER_PANEL_PARAM, MEDIA_QUERY, ROUTES } from "@/shared/config";
import { useTranslation } from "@/shared/i18n";
import { useMediaQuery } from "@/shared/lib";
import { Button } from "@/shared/ui/button";
import { ShellTopSlot } from "@/widgets/app-shell";

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

// 캠페인 현황: 진행 단계 탭·검색·유형 필터·표(PC)/카드(TAB·MO). 탭·검색·유형은 주소 쿼리가 소유함.
// 셸(헤더·LNB)은 app 레이어의 CampaignLayout이 감쌈.
export function CampaignStatusPage() {
  const { t } = useTranslation("pages/campaign-status");
  const { t: tCommon } = useTranslation();
  const navigate = useNavigate();
  const { search, key: locationKey } = useLocation();
  const rememberSearch = useCampaignStatusReturnStore(
    (state) => state.remember,
  );
  const session = useOutletContext<SessionViewModel>();
  const isTabletUp = useMediaQuery(MEDIA_QUERY.tabletUp);
  const isDesktop = useMediaQuery(MEDIA_QUERY.desktop);
  const params = useStatusParams();
  const scroll = useCampaignScrollList(params.baseQuery);

  // 등록 화면의 헤더 "<"가 탭·검색을 되살려 돌아오도록 마지막 쿼리와 기록 항목을 알려 둠(열려 있던 필터 화면은 제외).
  useEffect(() => {
    const params = new URLSearchParams(search);
    params.delete(FILTER_PANEL_PARAM);
    const rest = params.toString();
    rememberSearch(rest ? `?${rest}` : "", locationKey);
  }, [search, locationKey, rememberSearch]);

  // 할당된 Sub ID는 "+ 캠페인 등록하기"·"작성하기"·삭제를 쓰지 못함(스펙 P-3).
  const isSubAccount = session.authority === "SUB";
  const [isSubscribeAlertOpen, setIsSubscribeAlertOpen] = useState(false);
  // Sub ID는 구독 API가 403이라 읽지 않음("작성하기"도 못 씀).
  // "작성하기"를 누를 때만 쓰므로 돌아올 때마다 다시 읽지 않고, 캐시로 막힐 때만 새로 읽어 확인함.
  const subscriptions = useSubscriptions({
    isEnabled: !isSubAccount,
    revalidateIfStale: false,
  });
  const subscribedTypes = subscriptions.data
    ? getSubscribedTypes(subscriptions.data)
    : null;
  // 모든 탭에서 유지함
  const canRegister = !isSubAccount;

  function handleClickRegister() {
    void navigate(ROUTES.campaignCreate);
  }

  // 캐시가 다른 탭·기기에서 구독하기 전 값일 수 있어, 막아야 할 때는 새로 읽은 구독으로 다시 판단함.
  // 인자 없는 `mutate()`는 요청이 실패해도 reject하지 않고 갖고 있던 캐시 값을 돌려줘, 실패하면 캐시로 판단함.
  async function isWriteBlocked(campaign: CampaignSummary) {
    if (!isSubscriptionExpiredForWrite(campaign, subscribedTypes)) return false;
    const fresh = await subscriptions.mutate();
    return isSubscriptionExpiredForWrite(
      campaign,
      fresh ? getSubscribedTypes(fresh) : null,
    );
  }

  async function handleClickShortcut(
    campaign: CampaignSummary,
    kind: ShortcutKind,
  ) {
    switch (kind) {
      case "write":
        if (await isWriteBlocked(campaign)) {
          setIsSubscribeAlertOpen(true);
          return;
        }
        // 작성을 마친 데모는 고칠 수 없어 기본 정보(조회)로 바로 보냄.
        void navigate(
          campaign.isDemoCompleted
            ? getCampaignDetailPath(campaign.campaignIdx)
            : getCampaignRegisterPath(campaign.campaignIdx),
        );
        return;
      case "detail":
      case "rejectReason":
        void navigate(getCampaignDetailPath(campaign.campaignIdx));
        return;
      case "manage":
      case "result":
        // 진행 화면은 PICK형 브랜드형만 있음. 나머지 유형은 아직 준비 중.
        if (campaign.type !== "pickBrand") {
          toast(tCommon("status.comingSoon"));
          return;
        }
        void navigate(
          getCampaignProgressPath(
            campaign.campaignIdx,
            kind === "result" ? "result" : undefined,
          ),
        );
    }
  }

  function handleClickDetail(campaign: CampaignSummary) {
    void navigate(getCampaignDetailPath(campaign.campaignIdx));
  }

  function handleReload() {
    void scroll.reload();
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
  const listTotalCount = scroll.isLoading ? undefined : scroll.totalCount;
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
      {/* 탭은 스크롤 영역 밖 고정 영역에 그려, 겹치는 스크롤 막대가 탭 아래에서 시작함. */}
      <ShellTopSlot>
        <div className="ds-px-5 pt-2">
          <StatusTabs value={params.tab} onChange={params.setTab} />
        </div>
      </ShellTopSlot>
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
          isTabletUp={isTabletUp}
          isDesktop={isDesktop}
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
