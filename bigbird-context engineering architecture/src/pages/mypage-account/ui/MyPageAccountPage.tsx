import { useOutletContext, useSearchParams } from "react-router";

import { NotificationConsentCards } from "@/features/notification-consent";
import { WithdrawFlow } from "@/features/withdraw-account";
import { EmptyState } from "@/shared/components/empty-state";
import { useTranslation } from "@/shared/i18n";
import { useMediaQuery, usePanelParam, useTabParam } from "@/shared/lib";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/ui/tabs";

import { getAccountTabs } from "../model/tabs";
import { BankAccountTab } from "./BankAccountTab";
import { CompanyInfoTab } from "./CompanyInfoTab";
import { CreateSubAccountScreen } from "./CreateSubAccountScreen";
import { MasterAccountTab } from "./MasterAccountTab";
import { SubAccountTab } from "./SubAccountTab";
import { SubSelfTab } from "./SubSelfTab";

import type { SubAccountLayout } from "./SubAccountTab";
import type { SessionViewModel } from "@/entities/session";

const SUB_PANELS = ["create", "permission", "withdraw"] as const;
// 레이아웃 breakpoint는 홈과 같음(TAB 768~1439, PC 1440~).
const TABLET_QUERY = "(min-width: 768px)";
const DESKTOP_QUERY = "(min-width: 1440px)";

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
  // 탭이 바뀌면 하위 화면(Sub ID 생성·권한 부여)과 목록 검색어·쪽 쿼리는 지움.
  const { tab, setTab } = useTabParam({
    tabs,
    defaultTab: tabs[0],
    resetParams: ["panel", "subId", "keyword", "page"],
  });

  // Sub ID 생성·권한 부여 하위 화면은 URL 쿼리(panel, subId)가 소유함(뒤로 가기로 닫히고 새로고침해도 유지).
  const { panel, openPanel, closePanel } = usePanelParam({
    panels: SUB_PANELS,
    linkedParams: ["subId"],
  });
  const [searchParams] = useSearchParams();
  const subIdParam = Number(searchParams.get("subId"));
  const permissionAccountIdx =
    tab === "sub" && panel === "permission" && Number.isInteger(subIdParam)
      ? subIdParam
      : null;
  const isDesktop = useMediaQuery(DESKTOP_QUERY);
  const isTabletUp = useMediaQuery(TABLET_QUERY);
  const subLayout: SubAccountLayout = isDesktop
    ? "desktop"
    : isTabletUp
      ? "tablet"
      : "mobile";
  const isCreateOpen = tab === "sub" && panel === "create";
  const isWithdrawOpen = tab === "master" && panel === "withdraw";
  // 조회 API가 없어 목으로 그리는 화면(스펙 §1)은 개발 서버에서만 목을 쓰고, 빌드(stage·prod)에서는 "준비 중"을 보임.
  const isMockDataEnabled = import.meta.env.DEV;
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

  // TAB의 Sub ID 생성은 탭 줄까지 덮는 본문 전체 화면(시안).
  if (isCreateOpen && subLayout === "tablet") {
    return (
      <>
        <title>{t("title")}</title>
        <CreateSubAccountScreen
          variant="tablet"
          onClose={closePanel}
          onCreated={closePanel}
        />
      </>
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
        {/* 탭 줄은 스크롤해도 화면 위에 고정함. 위 여백(MO·TAB 8px, PC 20px)은 고정 영역이 직접 가져 스크롤 내용이
            그 위로 비치지 않게 함. 모바일은 탭이 넘치면 가로로 스크롤하는데, 잘리는 위치가 콘텐츠 여백이 아니라
            화면 가장자리가 되도록 스크롤 영역을 레이아웃 좌우 여백(--mypage-gutter)만큼 넓히고 첫 탭을 콘텐츠 선에 맞추는 여백은 목록이 가짐. */}
        <div className="sticky top-0 z-10 -mx-(--mypage-gutter) overflow-x-auto bg-background pt-2 tablet:mx-0 desktop:pt-5">
          <TabsList
            variant="line"
            className="w-full min-w-max justify-start px-(--mypage-gutter) tablet:px-0"
          >
            {tabs.map((accountTab) => (
              <TabsTrigger
                key={accountTab}
                value={accountTab}
                className="flex-none"
              >
                {t(`tabs.${accountTab}`)}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>
        {tabs.map((accountTab) => (
          <TabsContent
            key={accountTab}
            value={accountTab}
            // 셸이 아래 여백을 두지 않으므로 직접 둠. Sub ID 관리는 MO의 하단 고정 버튼이 바닥에 붙어야 해서 MO만 제외.
            className={
              accountTab === "sub" ? "tablet:pb-5" : "pb-4 tablet:pb-5"
            }
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
                isCreateOpen={isCreateOpen}
                onOpenCreate={() => openPanel("create")}
                onCloseCreate={closePanel}
                permissionAccountIdx={permissionAccountIdx}
                onOpenPermission={(account) =>
                  openPanel("permission", { subId: String(account.accountIdx) })
                }
                onClosePermission={closePanel}
              />
            )}
            {accountTab === "self" &&
              (isMockDataEnabled ? <SubSelfTab /> : comingSoon)}
            {accountTab === "notification" &&
              (isMockDataEnabled ? <NotificationConsentCards /> : comingSoon)}
            {!IMPLEMENTED_TABS.includes(accountTab) && comingSoon}
          </TabsContent>
        ))}
      </Tabs>
      {/* PC·TAB은 시안대로 중앙 다이얼로그(딤 있음). 뒤로 가기로도 닫힘. */}
      {isWithdrawOpen && <WithdrawFlow variant="dialog" onClose={closePanel} />}
    </>
  );
}
