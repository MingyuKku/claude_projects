import { Plus } from "lucide-react";
import { useNavigate, useOutletContext } from "react-router";
import { toast } from "sonner";

import { useCampaignPage, useCampaignScrollList } from "@/entities/campaign";
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

import { useStatusParams } from "../model/use-status-params";
import { CampaignListSection } from "./CampaignListSection";
import { StatusTabs } from "./StatusTabs";

import type { SessionViewModel } from "@/entities/session";

// 캠페인 현황: 진행 단계 탭·검색·유형 필터·표(PC)/카드(TAB·MO). 탭·검색·유형·쪽은 주소 쿼리가 소유함.
// 셸(헤더·LNB)은 app 레이어의 CampaignLayout이 감쌈. 바로 가기가 갈 등록 마법사·등록 내역·캠페인 관리 화면은 아직 없어
// 모두 "준비 중" 토스트를 띄움(화면이 생기면 `onClickShortcut`·`onClickDetail`에서 이동으로 바꿈).
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
  // PC·TAB은 전체 탭에만, MO는 모든 탭 위에 둠(시안, 스펙 D-3).
  const canRegister = !isSubAccount && (!isTabletUp || params.tab === "all");

  function handleClickRegister() {
    void navigate(ROUTES.campaignCreate);
  }

  function handleClickComingSoon() {
    toast(tCommon("status.comingSoon"));
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
  const emptyContent = isAccountEmpty ? (
    <EmptyState
      type="no-list"
      title={t("empty.account.title")}
      description={t("empty.account.description")}
      className="flex-1 py-10"
      action={
        isSubAccount ? undefined : (
          <Button variant="outline" onClick={handleClickRegister}>
            {t("action.register")}
          </Button>
        )
      }
    />
  ) : (
    <ListEmptyState
      kind={emptyKind}
      keyword={params.keyword}
      noneTitle={t(`empty.tab.${params.tab}`)}
      height="fill"
    />
  );

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
      <div className="flex flex-1 flex-col gap-3 ds-px-5 ds-pt-6 ds-pb-5 tablet:gap-4 desktop:gap-3">
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
          onClickShortcut={handleClickComingSoon}
          onClickDetail={handleClickComingSoon}
          onDeleted={handleReload}
        />
      </div>
    </div>
  );
}
