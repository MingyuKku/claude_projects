import { useNavigate, useSearchParams } from "react-router";

import { IdFind, PwFind } from "@/features/find-account";
import { AuthHeader, AuthText } from "@/shared/components/auth";
import { ROUTES } from "@/shared/config";
import { cn } from "@/shared/lib";

const FIND_TABS = [
  { key: "id", label: "아이디" },
  { key: "pw", label: "비밀번호" },
] as const;

type FindTab = (typeof FIND_TABS)[number]["key"];

const TAB_PARAM = "type";
const DEFAULT_TAB: FindTab = "id";

export function FindPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  // The login screen's "비밀번호 찾기" link arrives as ?type=pw.
  const tab: FindTab =
    searchParams.get(TAB_PARAM) === "pw" ? "pw" : DEFAULT_TAB;

  function handleClickTab(nextTab: FindTab) {
    setSearchParams({ [TAB_PARAM]: nextTab }, { replace: true });
  }

  function handleClickGoLogin() {
    void navigate(ROUTES.login);
  }

  return (
    <div className="flex min-h-dvh flex-col items-center bg-background">
      <title>아이디·비밀번호 찾기</title>
      <AuthHeader
        title="아이디/비밀번호 찾기"
        onClickBack={handleClickGoLogin}
        hideBorder
      />

      <div className="flex w-80 flex-1 flex-col gap-10 tablet:w-96 tablet:gap-12 tablet:pt-12">
        <div role="tablist" className="flex">
          {FIND_TABS.map((findTab) => {
            const isSelected = tab === findTab.key;
            return (
              <button
                key={findTab.key}
                type="button"
                role="tab"
                aria-selected={isSelected}
                onClick={() => handleClickTab(findTab.key)}
                className={cn(
                  "flex h-[54px] flex-1 items-center justify-center",
                  isSelected
                    ? "border-b-[3px] border-brand"
                    : "border-b border-gray-200",
                )}
              >
                <AuthText
                  as="span"
                  size="lg"
                  weight={isSelected ? "bold" : "normal"}
                  className="text-heading!"
                >
                  {findTab.label}
                </AuthText>
              </button>
            );
          })}
        </div>

        {tab === "id" ? (
          <IdFind
            onClickGoLogin={handleClickGoLogin}
            onClickGoFindPassword={() => handleClickTab("pw")}
          />
        ) : (
          <PwFind />
        )}
      </div>
    </div>
  );
}
