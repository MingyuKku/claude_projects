import { useSearchParams } from "react-router";

import { LIST_QUERY_PARAMS } from "@/features/bigbird-money-history";
import { useTranslation } from "@/shared/i18n";
import { useMediaQuery, usePanelParam, useTabParam } from "@/shared/lib";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/ui/tabs";

import { CHARGE_VIEWS, MONEY_PANELS, MONEY_TABS } from "../model/tabs";
import { usePaymentReturn } from "../model/use-payment-return";
import { ChargeTab } from "./ChargeTab";
import { PaymentRequestedDialog } from "./PaymentRequestedDialog";
import { UsageTab } from "./UsageTab";

import type { MoneyLayout, MoneyPanel } from "../model/tabs";

// 레이아웃 breakpoint는 홈·계정 설정과 같음(TAB 768~1439, PC 1440~).
const TABLET_QUERY = "(min-width: 768px)";
const DESKTOP_QUERY = "(min-width: 1440px)";
// 탭 본문의 최대 폭(시안 PC 1440 화면의 본문 폭 1170). 더 넓은 화면에서는 가운데 정렬함.
const CONTENT_WIDTH_CLASS_NAME = "mx-auto w-full max-w-292.5";
// 탭이나 세그먼트를 바꾸면 하위 화면과 목록 쿼리를 지움.
const RESET_PARAMS = ["panel", "id", "view", ...LIST_QUERY_PARAMS];

// 하위 화면은 속한 탭에서만 열림(주소를 직접 고쳐 다른 탭의 값을 넣어도 무시).
const PANEL_TAB = {
  charge: "charge",
  "charge-detail": "charge",
  "usage-detail": "usage",
} as const satisfies Record<MoneyPanel, "charge" | "usage">;

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
    requestedPanel !== null && PANEL_TAB[requestedPanel] === tab
      ? requestedPanel
      : null;
  const activeId = searchParams.get("id");
  const { isRequested, closeAlert } = usePaymentReturn();

  const isDesktop = useMediaQuery(DESKTOP_QUERY);
  const isTabletUp = useMediaQuery(TABLET_QUERY);
  const layout: MoneyLayout = isDesktop
    ? "desktop"
    : isTabletUp
      ? "tablet"
      : "mobile";

  function handleConfirmRequested() {
    closeAlert();
    // MO는 새 건이 있는 상세 내역으로 보냄.
    setSearchParams(
      (prev) => {
        const params = new URLSearchParams(prev);
        params.set("view", "history");
        return params;
      },
      { replace: true },
    );
  }

  return (
    <>
      <title>{t("title")}</title>
      <Tabs
        value={tab}
        onValueChange={setTab}
        className="gap-4 tablet:gap-5 desktop:gap-6"
      >
        {/* 탭 줄은 스크롤해도 화면 위에 고정함. 위 여백(MO·TAB 8px, PC 20px)은 고정 영역이 직접 가져 스크롤 내용이 그 위로 비치지 않게 함. */}
        <div className="sticky top-0 z-10 -mx-(--mypage-gutter) bg-background px-(--mypage-gutter) pt-2 tablet:mx-0 tablet:px-0 desktop:pt-5">
          <TabsList variant="line" className="w-full justify-start">
            {MONEY_TABS.map((moneyTab) => (
              <TabsTrigger
                key={moneyTab}
                value={moneyTab}
                className="flex-1 tablet:flex-none"
              >
                {t(`tabs.${moneyTab}`)}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>
        <TabsContent
          value="charge"
          className={`${CONTENT_WIDTH_CLASS_NAME} pb-4 tablet:pb-5`}
        >
          <ChargeTab
            layout={layout}
            view={view}
            onChangeView={setView}
            panel={panel}
            activeId={activeId}
            onOpenCharge={() => openPanel("charge")}
            onOpenDetail={(id) => openPanel("charge-detail", { id })}
            onClosePanel={closePanel}
          />
        </TabsContent>
        <TabsContent
          value="usage"
          className={`${CONTENT_WIDTH_CLASS_NAME} pb-4 tablet:pb-5`}
        >
          <UsageTab
            layout={layout}
            panel={panel}
            activeId={activeId}
            onOpenDetail={(id) => openPanel("usage-detail", { id })}
            onClosePanel={closePanel}
          />
        </TabsContent>
      </Tabs>
      <PaymentRequestedDialog
        open={isRequested}
        onConfirm={handleConfirmRequested}
      />
    </>
  );
}
