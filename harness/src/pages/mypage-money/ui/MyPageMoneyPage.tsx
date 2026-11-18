import { useSearchParams } from "react-router";

import { useRefreshBigbirdMoneyBalance } from "@/entities/bigbird-money";
import {
  ChargeHistory,
  LIST_QUERY_PARAMS,
  UsageHistory,
  useReloadChargeHistory,
} from "@/features/bigbird-money-history";
import {
  PaymentRequestedDialog,
  usePaymentReturn,
} from "@/features/charge-bigbird-money";
import { useFilterScreen } from "@/shared/components/list-filter";
import { StickyTabBar } from "@/shared/components/sticky-tab-bar";
import { MEDIA_QUERY } from "@/shared/config";
import { useTranslation } from "@/shared/i18n";
import { useMediaQuery, usePanelParam, useTabParam } from "@/shared/lib";
import { cn } from "@/shared/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/ui/tabs";

import { CHARGE_VIEWS, MONEY_PANELS, MONEY_TABS } from "../model/tabs";
import { useWithdrawnAlert } from "../model/use-withdrawn-alert";
import { MoneySummary } from "./MoneySummary";
import { PanelFrame } from "./PanelFrame";
import { useMoneySidePanel } from "./use-money-side-panel";
import { WithdrawnDialog } from "./WithdrawnDialog";

import type { MoneyLayout, MoneyPanel, MoneyTab } from "../model/tabs";
import type { ReactNode } from "react";

const CONTENT_WIDTH_CLASS_NAME = "mx-auto w-full max-w-292.5";
// 탭이나 세그먼트를 바꾸면 하위 화면과 목록 쿼리를 지움.
const RESET_PARAMS = ["panel", "id", "view", ...LIST_QUERY_PARAMS];

// 하위 화면이 열리는 탭. 충전·출금은 보유 머니 카드가 두 탭 위에 있어 어느 탭에서나 그 자리에서 열림.
// 상세는 속한 탭에서만 열림(주소를 직접 고쳐 다른 탭의 값을 넣어도 무시).
const PANEL_TABS: Record<MoneyPanel, readonly MoneyTab[]> = {
  charge: ["charge", "usage"],
  withdraw: ["charge", "usage"],
  "charge-detail": ["charge"],
  "usage-detail": ["usage"],
};

// 셸(헤더·LNB)은 app 레이어의 MypageLayout이 감쌈. 탭·세그먼트·하위 화면은 URL 쿼리가 소유함(뒤로 가기로 닫히고 새로고침해도 유지).
export function MyPageMoneyPage() {
  const { t } = useTranslation("pages/mypage-money");
  const [searchParams, setSearchParams] = useSearchParams();
  const { tab, setTab } = useTabParam({
    tabs: MONEY_TABS,
    defaultTab: "charge",
    resetParams: RESET_PARAMS,
  });
  // 세그먼트를 바꿔도 목록 쿼리는 지움(필터·쪽은 상세 내역 목록의 것).
  const { tab: view, setTab: setView } = useTabParam({
    tabs: CHARGE_VIEWS,
    defaultTab: "balance",
    param: "view",
    resetParams: ["panel", "id", ...LIST_QUERY_PARAMS],
  });
  const {
    panel: requestedPanel,
    openPanel,
    closePanel,
  } = usePanelParam({
    panels: MONEY_PANELS,
    linkedParams: ["id"],
  });
  const panel =
    requestedPanel !== null && PANEL_TABS[requestedPanel].includes(tab)
      ? requestedPanel
      : null;
  const activeId = searchParams.get("id");
  const reloadHistory = useReloadChargeHistory();
  const refreshBalance = useRefreshBigbirdMoneyBalance();
  const { isRequested, closeAlert } = usePaymentReturn({
    // 재조회에 실패하면 내역 목록이 자체 오류 상태를 보여 줌.
    onReturned: () => Promise.all([reloadHistory(), refreshBalance()]),
  });
  const withdrawn = useWithdrawnAlert();

  const isDesktop = useMediaQuery(MEDIA_QUERY.desktop);
  const isTabletUp = useMediaQuery(MEDIA_QUERY.tabletUp);
  const layout: MoneyLayout = isDesktop
    ? "desktop"
    : isTabletUp
      ? "tablet"
      : "mobile";

  const sidePanel = useMoneySidePanel({
    panel,
    activeId,
    hasBackButton: layout !== "desktop",
    onClose: closePanel,
    onWithdrawn: withdrawn.onWithdrawn,
  });
  const isPanelOpen = sidePanel !== null;
  // TAB 사용 내역의 "필터 검색 설정"은 모달처럼 헤더·LNB만 두고 본문 전체(요약 카드·탭 줄 포함)를 덮음.
  // 충전/출금 내역은 TAB에서 필터가 인라인이라 화면이 없음.
  const filterScreen = useFilterScreen("desktop");
  const isTabletFilter = tab === "usage" && filterScreen.isOpen;

  function tabLabel(moneyTab: MoneyTab) {
    return moneyTab === "usage" ? t("tabs.usage") : t("tabs.charge");
  }

  // 충전·출금 접수 뒤 확인: 새 건이 있는 충전/출금 내역(MO 세그먼트 "상세 내역")으로 보냄.
  function showChargeHistory() {
    setSearchParams(
      (prev) => {
        const params = new URLSearchParams(prev);
        params.delete("panel");
        params.delete("id");
        params.delete("tab");
        params.set("view", "history");
        return params;
      },
      { replace: true },
    );
  }

  function handleConfirmRequested() {
    closeAlert();
    showChargeHistory();
  }

  function handleConfirmWithdrawn() {
    withdrawn.closeAlert();
    showChargeHistory();
  }

  const summary = (
    <MoneySummary
      isPanelOpen={layout === "desktop" && isPanelOpen}
      onOpenCharge={() => openPanel("charge")}
      onOpenWithdraw={() => openPanel("withdraw")}
    />
  );
  const lists: Record<MoneyTab, ReactNode> = {
    charge: (
      <ChargeHistory
        activeId={panel === "charge-detail" && isPanelOpen ? activeId : null}
        isPanelOpen={isPanelOpen}
        onClickDetail={(id) => openPanel("charge-detail", { id })}
      />
    ),
    usage: (
      <UsageHistory
        activeId={panel === "usage-detail" && isPanelOpen ? activeId : null}
        isPanelOpen={isPanelOpen}
        onClickDetail={(id) => openPanel("usage-detail", { id })}
      />
    ),
  };

  // 탭 아래 본문. TAB·MO에서 하위 화면이 열리면 그 카드가 본문을 대체하고 화면 아래까지 채움(하단 버튼이 맨 아래).
  const isScreenPanel = layout !== "desktop" && isPanelOpen;

  function tabBody(moneyTab: MoneyTab) {
    if (isScreenPanel) {
      return <PanelFrame variant="screen">{sidePanel}</PanelFrame>;
    }
    if (layout !== "mobile") return lists[moneyTab];
    return (
      <Tabs value={view} onValueChange={setView} className="flex-1 gap-4">
        <TabsList className="w-full">
          {CHARGE_VIEWS.map((chargeView) => (
            <TabsTrigger key={chargeView} value={chargeView} className="flex-1">
              {t(`views.${chargeView}`)}
            </TabsTrigger>
          ))}
        </TabsList>
        <TabsContent value="balance">{summary}</TabsContent>
        <TabsContent value="history" className="flex flex-col">
          {lists[moneyTab]}
        </TabsContent>
      </Tabs>
    );
  }

  // PC·TAB은 카드를 탭 위에 둠. TAB에서 하위 화면이 열리면 카드를 숨김.
  const showsSummaryAboveTabs =
    layout === "desktop" ||
    (layout === "tablet" && !isPanelOpen && !isTabletFilter);
  // TAB·MO의 풀페이지 화면(거래·사용 상세, 충전, 출금, TAB 필터)은 모달처럼 상단 탭 줄 없이 본문만 그림.
  const hidesTabBar = isScreenPanel || isTabletFilter;
  const tabs = (
    <Tabs
      value={tab}
      onValueChange={setTab}
      // flex-1: 내역이 비면 안내가 화면 안의 남은 높이를 채움(페이지 전체 스크롤 방지).
      // 하위 화면 카드가 열리면 화면 높이를 넘지 않도록 min-h-0으로 줄어들 수 있게 함.
      className={cn("flex-1 ds-gap-6", isScreenPanel && "min-h-0")}
    >
      {/* 탭 줄은 스크롤해도 화면 위에 고정함. 위 여백은 고정 영역이 직접 가져 스크롤 내용이 그 위로 비치지 않게 함. */}
      {!hidesTabBar && (
        <StickyTabBar
          className={showsSummaryAboveTabs ? "tablet:ds-pt-6" : undefined}
          tabs={MONEY_TABS.map((moneyTab) => ({
            value: moneyTab,
            label: tabLabel(moneyTab),
          }))}
        />
      )}
      {MONEY_TABS.map((moneyTab) => (
        <TabsContent
          key={moneyTab}
          value={moneyTab}
          // isolate: 본문 안의 z-index(MO 세그먼트 토글의 z-10 등)를 본문에 가둬 고정 탭 줄(z-10) 아래에 그림.
          className={cn(
            "isolate flex flex-col pb-4 tablet:pb-5",
            isScreenPanel && "min-h-0",
            // 탭 줄이 없는 하위 화면 카드는 탭 줄이 가지던 위 여백을 이어받음. 필터 화면은 헤더 바로 아래에서 시작함.
            hidesTabBar && !isTabletFilter && "pt-2",
          )}
        >
          {tabBody(moneyTab)}
        </TabsContent>
      ))}
    </Tabs>
  );

  return (
    <>
      <title>{t("title")}</title>
      <div
        className={cn(
          "flex gap-6",
          // 하위 화면 카드(TAB·MO)는 화면 높이에서 멈추고 안쪽만 스크롤해, 하단 버튼이 늘 보이게 함. 그 밖에는 내용만큼 늘어남.
          isScreenPanel ? "h-full" : "min-h-full",
          layout !== "mobile" && CONTENT_WIDTH_CLASS_NAME,
        )}
      >
        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          {showsSummaryAboveTabs && (
            <div className="pt-2 desktop:pt-5">{summary}</div>
          )}
          {tabs}
        </div>
        {layout === "desktop" && isPanelOpen && (
          // 패널은 스크롤해도 화면에 붙어 있고 높이는 화면에 맞춤(하단 버튼이 늘 보이게). 화면에서 헤더를 뺀 높이.
          <div className="sticky top-0 flex h-[calc(100dvh-var(--app-header-height))] shrink-0 self-start py-5">
            <PanelFrame variant="aside">{sidePanel}</PanelFrame>
          </div>
        )}
      </div>
      <WithdrawnDialog
        open={withdrawn.isOpen}
        requestedAt={withdrawn.requestedAt}
        onConfirm={handleConfirmWithdrawn}
      />
      <PaymentRequestedDialog
        open={isRequested}
        onConfirm={handleConfirmRequested}
      />
    </>
  );
}
