import { useNavigate, useSearchParams } from "react-router";

import { IdFind, PwFind } from "@/features/find-account";
import { AuthHeader, AuthTab } from "@/shared/components/auth";
import { ROUTES } from "@/shared/config";
import { useTranslation } from "@/shared/i18n";

const FIND_TABS = [
  { key: "id", labelKey: "field.id" },
  { key: "pw", labelKey: "field.password" },
] as const;

type FindTab = (typeof FIND_TABS)[number]["key"];

const TAB_PARAM = "type";
const ID_TAB: FindTab = FIND_TABS[0].key;
const PASSWORD_TAB: FindTab = FIND_TABS[1].key;
const DEFAULT_TAB = ID_TAB;

export function FindPage() {
  const { t } = useTranslation("pages/find");
  const { t: tCommon } = useTranslation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  // 로그인 화면의 "비밀번호 찾기" 링크는 ?type=pw 로 들어옴.
  const tab: FindTab =
    searchParams.get(TAB_PARAM) === PASSWORD_TAB ? PASSWORD_TAB : DEFAULT_TAB;

  function handleClickTab(nextTab: FindTab) {
    setSearchParams({ [TAB_PARAM]: nextTab }, { replace: true });
  }

  function handleClickGoLogin() {
    void navigate(ROUTES.login);
  }

  return (
    <div className="flex min-h-dvh flex-col items-center bg-background">
      <title>{t("title")}</title>
      <AuthHeader
        title={t("header")}
        onClickBack={handleClickGoLogin}
        isBorderHidden
      />

      {/* 모바일은 탭 아래 40, 태블릿 이상은 헤더·탭·본문 사이 48이고 바닥 여백이 따로 있음. */}
      <div className="flex w-80 flex-1 flex-col gap-10 tablet:w-96 tablet:gap-12 tablet:pt-12 tablet:pb-17.5 desktop:pb-30">
        <div role="tablist" className="flex">
          {FIND_TABS.map((findTab) => (
            <AuthTab
              key={findTab.key}
              isSelected={tab === findTab.key}
              label={tCommon(findTab.labelKey)}
              onClick={() => handleClickTab(findTab.key)}
            />
          ))}
        </div>

        {tab === ID_TAB ? (
          <IdFind
            onClickGoLogin={handleClickGoLogin}
            onClickGoFindPassword={() => handleClickTab(PASSWORD_TAB)}
          />
        ) : (
          <PwFind />
        )}
      </div>
    </div>
  );
}
