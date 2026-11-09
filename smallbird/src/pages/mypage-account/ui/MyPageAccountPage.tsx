import { useOutletContext, useSearchParams } from "react-router";

import { useSubAccount } from "@/features/manage-sub-accounts";
import { NotificationConsentCards } from "@/features/notification-consent";
import { WithdrawFlow } from "@/features/withdraw-account";
import { EmptyState } from "@/shared/components/empty-state";
import { StickyTabBar } from "@/shared/components/sticky-tab-bar";
import { MEDIA_QUERY } from "@/shared/config";
import { useTranslation } from "@/shared/i18n";
import { useMediaQuery, usePanelParam, useTabParam } from "@/shared/lib";
import { cn } from "@/shared/lib/utils";
import { Tabs, TabsContent } from "@/shared/ui/tabs";

import { getAccountTabs } from "../model/tabs";
import { BankAccountTab } from "./BankAccountTab";
import { CompanyInfoTab } from "./CompanyInfoTab";
import { MasterAccountTab } from "./MasterAccountTab";
import { SubAccountFormScreen } from "./SubAccountFormScreen";
import { SubAccountTab } from "./SubAccountTab";
import { SubSelfTab } from "./SubSelfTab";

import type { SubAccountLayout } from "./SubAccountTab";
import type { SessionViewModel } from "@/entities/session";

const SUB_PANELS = ["create", "permission", "edit", "withdraw"] as const;
// 레이아웃 breakpoint는 홈과 같음(TAB 768~1439, PC 1440~).
// 모든 탭 본문이 공유하는 콘텐츠 폭. 시안(10061:200877)의 PC 1440 화면에서 본문 폭 1170을 최대 너비로 두고, 더 넓은 화면에서는
// 가로 가운데 정렬함. 그보다 좁으면 가용 폭을 다 씀.
const TAB_CONTENT_WIDTH_CLASS_NAME = "mx-auto w-full max-w-292.5";

// 탭 본문을 구현한 탭. 나머지는 각 feature가 구현되기 전까지 "준비 중" 안내.
const IMPLEMENTED_TABS: readonly string[] = [
  "master",
  "company",
  "bank",
  "sub",
  "notification",
  "self",
];

// 셸(헤더·LNB)은 app 레이어의 MypageLayout이 감싸고, 세션은 Outlet context로 받음.
export function MyPageAccountPage() {
  const { t } = useTranslation("pages/mypage-account");
  const { t: tCommon } = useTranslation();
  const session = useOutletContext<SessionViewModel>();
  const tabs = getAccountTabs(session.authority);
  // 탭이 바뀌면 하위 화면(Sub ID 생성·권한 부여·수정)과 목록 검색어·쪽 쿼리는 지움.
  const { tab, setTab } = useTabParam({
    tabs,
    defaultTab: tabs[0],
    resetParams: ["panel", "subId", "keyword", "page"],
  });

  // Sub ID 생성·권한 부여·수정 하위 화면은 URL 쿼리(panel, subId)가 소유함(뒤로 가기로 닫히고 새로고침해도 유지).
  const { panel, openPanel, closePanel } = usePanelParam({
    panels: SUB_PANELS,
    linkedParams: ["subId"],
  });
  const [searchParams] = useSearchParams();
  const subIdParam = Number(searchParams.get("subId"));
  const panelAccountIdx =
    tab === "sub" &&
    (panel === "permission" || panel === "edit") &&
    Number.isInteger(subIdParam)
      ? subIdParam
      : null;
  // 수정 대상은 지금 보이는 목록에 있는 Sub ID만 엶(지워졌거나 주소를 고친 subId는 열지 않음).
  const editAccount = useSubAccount(panel === "edit" ? panelAccountIdx : null);
  const permissionAccount = useSubAccount(
    panel === "permission" ? panelAccountIdx : null,
  );
  const isDesktop = useMediaQuery(MEDIA_QUERY.desktop);
  const isTabletUp = useMediaQuery(MEDIA_QUERY.tabletUp);
  const subLayout: SubAccountLayout = isDesktop
    ? "desktop"
    : isTabletUp
      ? "tablet"
      : "mobile";
  const subPanel =
    tab === "sub" &&
    (panel === "create" || panel === "permission" || panel === "edit")
      ? panel
      : null;
  // TAB의 권한 부여 카드는 모달처럼 상단 탭 줄 없이 본문만 그림(시안 10724:187291, 디자인 QA TAB 해상도 모달 상단 탭 삭제).
  const hidesTabBar =
    subLayout === "tablet" &&
    subPanel === "permission" &&
    permissionAccount !== null;
  const isWithdrawOpen = tab === "master" && panel === "withdraw";
  const comingSoon = (
    <EmptyState
      type="construction"
      title={tCommon("status.comingSoon")}
      className="py-20"
    />
  );

  // MO의 회원 탈퇴 흐름(약관·비밀번호 확인)은 탭 줄까지 덮는 전체 화면.
  if (isWithdrawOpen && subLayout === "mobile") {
    return (
      <>
        <title>{t("title")}</title>
        <WithdrawFlow variant="screen" onClose={closePanel} />
      </>
    );
  }

  // TAB의 Sub ID 생성·수정은 탭 줄까지 덮는 본문 전체 화면(시안).
  if (
    subLayout === "tablet" &&
    (subPanel === "create" || (subPanel === "edit" && editAccount))
  ) {
    return (
      <>
        <title>{t("title")}</title>
        <SubAccountFormScreen
          variant="tablet"
          account={editAccount ?? undefined}
          onClose={closePanel}
          onSaved={closePanel}
        />
      </>
    );
  }

  return (
    <>
      <title>{t("title")}</title>
      {/* --account-tabs-offset: 고정된 탭 줄 높이(위 여백 + 탭 36) + 탭 줄과 본문 사이 간격(gap). 본문 안의 요소로 스크롤할 때
          탭 줄에 가리지 않게 쓰는 값이라, 탭 줄·gap을 바꾸면 함께 맞춤(TAB 8+36+20, PC 20+36+24). */}
      <Tabs
        value={tab}
        onValueChange={setTab}
        className="min-h-full gap-4 [--account-tabs-offset:--spacing(16)] tablet:gap-5 desktop:gap-6 desktop:[--account-tabs-offset:--spacing(20)]"
      >
        {/* 탭 줄은 스크롤해도 화면 위에 고정함. 위 여백(MO·TAB 8px, PC 20px)은 고정 영역이 직접 가져 스크롤 내용이
            그 위로 비치지 않게 함. 모바일은 탭이 넘치면 가로로 스크롤하는데, 잘리는 위치가 콘텐츠 여백이 아니라
            화면 가장자리가 되도록 스크롤 영역을 레이아웃 좌우 여백(--mypage-gutter)만큼 넓히고 첫 탭을 콘텐츠 선에 맞추는 여백은 목록이 가짐. */}
        {!hidesTabBar && (
          <StickyTabBar
            scrollable
            className="desktop:pt-5"
            tabs={tabs.map((accountTab) => ({
              value: accountTab,
              label: t(`tabs.${accountTab}`),
            }))}
          />
        )}
        {tabs.map((accountTab) => (
          <TabsContent
            key={accountTab}
            value={accountTab}
            // isolate: 본문 안의 z-index를 본문에 가둬 고정 탭 줄(z-10) 아래에 그림.
            // 셸이 아래 여백을 두지 않으므로 직접 둠. Sub ID 관리는 MO의 하단 고정 버튼이 바닥에 붙어야 해서 MO만 제외.
            className={cn(
              "isolate",
              TAB_CONTENT_WIDTH_CLASS_NAME,
              accountTab === "sub"
                ? "data-[state=active]:flex data-[state=active]:flex-col tablet:pb-5"
                : "pb-4 tablet:pb-5",
              // 탭 줄이 없는 권한 부여 카드는 탭 줄이 가지던 위 여백 8을 이어받음(시안).
              hidesTabBar && "tablet:pt-2",
            )}
          >
            {accountTab === "master" && (
              <MasterAccountTab onClickWithdraw={() => openPanel("withdraw")} />
            )}
            {accountTab === "company" && <CompanyInfoTab />}
            {accountTab === "bank" && (
              <BankAccountTab
                onGoCompany={() => setTab("company")}
                onLeave={() => setTab("master")}
              />
            )}
            {accountTab === "sub" && (
              <SubAccountTab
                layout={subLayout}
                panel={subPanel}
                panelAccountIdx={panelAccountIdx}
                onOpenCreate={() => openPanel("create")}
                onOpenPermission={(account) =>
                  openPanel("permission", { subId: String(account.accountIdx) })
                }
                onOpenEdit={(account) =>
                  openPanel("edit", { subId: String(account.accountIdx) })
                }
                onClosePanel={closePanel}
              />
            )}
            {accountTab === "self" && <SubSelfTab />}
            {accountTab === "notification" && <NotificationConsentCards />}
            {!IMPLEMENTED_TABS.includes(accountTab) && comingSoon}
          </TabsContent>
        ))}
      </Tabs>
      {/* PC·TAB은 시안대로 중앙 다이얼로그(딤 있음). 뒤로 가기로도 닫힘. */}
      {isWithdrawOpen && <WithdrawFlow variant="dialog" onClose={closePanel} />}
    </>
  );
}
