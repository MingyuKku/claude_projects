import { ChevronLeft } from "lucide-react";
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router";

import { LoginForm, resolveBrand } from "@/features/login";
import {
  SnsLoginRow,
  snsLoginFailedStateSchema,
} from "@/features/social-login";
import { TermsDialog, useTermsDialog } from "@/features/view-terms";
import { HISTORY_BACK } from "@/shared/config";
import { useTranslation } from "@/shared/i18n";
import { cn } from "@/shared/lib";
import { Button } from "@/shared/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/ui/tabs";

import { DEFAULT_LOGIN_TAB, isLoginTab, LOGIN_TABS } from "../model/constants";
import { ComingSoonAlertDialog, LockedAlertDialog } from "./LoginAlertDialogs";
import { LoginMoreMenu } from "./LoginMoreMenu";
import { LoginTermsLinks } from "./LoginTermsLinks";
import { QuestionPanel } from "./QuestionPanel";

import type { LoginTab } from "../model/constants";
import type { CssVariableStyle } from "@/shared/lib";

/** 소셜 로그인 안내. 시작 실패(공급자 화면을 열지 못함)와 로그인 실패(공급자를 거친 뒤 거절·오류)를 나눔. */
type SnsError = "start" | "login";

export function LoginPage() {
  const { t } = useTranslation("pages/login");
  const { t: tCommon } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const brand = resolveBrand(window.location.hostname, window.location.search);
  const terms = useTermsDialog();

  const [tab, setTab] = useState<LoginTab>(DEFAULT_LOGIN_TAB);
  const [isQuestionOpen, setIsQuestionOpen] = useState(false);
  const [lockedUserId, setLockedUserId] = useState<string | null>(null);
  const [isComingSoonOpen, setIsComingSoonOpen] = useState(false);
  const hasFailedState = snsLoginFailedStateSchema.safeParse(
    location.state,
  ).success;
  // 복귀 화면이 실패 state와 함께 보내면 처음부터 로그인 실패 안내를 보임.
  const [snsError, setSnsError] = useState<SnsError | null>(() =>
    hasFailedState ? "login" : null,
  );

  // 새로고침·뒤로가기로 같은 안내가 다시 뜨지 않게 방문 기록의 실패 state를 지움(안내는 위 state로 유지).
  useEffect(() => {
    if (hasFailedState) {
      void navigate(location.pathname, { replace: true, state: null });
    }
  }, [hasFailedState, location.pathname, navigate]);

  // 펫플레이는 주 색상만 바뀜. 버튼·탭 밑줄이 쓰는 --primary를 덮어쓰고,
  // 디자인 시스템처럼 hover는 주 색상보다 밝게 파생함.
  const brandStyle: CssVariableStyle | undefined = brand.primaryColor
    ? {
        "--primary": brand.primaryColor,
        "--primary-hover": `color-mix(in srgb, ${brand.primaryColor} 85%, white)`,
      }
    : undefined;
  const isCreatorTab = tab === "creator";
  const openComingSoon = isCreatorTab
    ? () => setIsComingSoonOpen(true)
    : undefined;

  function handleChangeTab(value: string) {
    if (isLoginTab(value)) setTab(value);
  }

  function handleClickBack() {
    void navigate(HISTORY_BACK);
  }

  return (
    <div
      className="relative flex min-h-dvh flex-col bg-background"
      style={brandStyle}
    >
      <title>{t("title")}</title>
      {!isQuestionOpen && (
        <LoginMoreMenu
          onSelectPrivacy={() => terms.openTerms("privacy")}
          onSelectTerms={() => terms.openTerms("service")}
        />
      )}

      <div className="flex flex-1 flex-col items-center px-4 pt-5 pb-15 tablet:justify-center tablet:px-0 tablet:py-15">
        <div className="relative flex w-full max-w-96 flex-col ds-gap-7">
          {isQuestionOpen ? (
            <QuestionPanel onClickClose={() => setIsQuestionOpen(false)} />
          ) : (
            <>
              {brand.shouldShowQuestion && (
                <button
                  type="button"
                  aria-label={t("questionLabel")}
                  onClick={() => setIsQuestionOpen(true)}
                  // 원본에도 `icon-questions`의 CSS 정의가 없어 아무것도 그려지지 않음.
                  // 디자인 결정이 필요함.
                  className="icon-questions absolute top-2.5 right-11 tablet:top-0 tablet:right-0"
                />
              )}

              <div className="flex flex-col items-center ds-gap-6">
                <img
                  src={brand.logo}
                  alt={t(`brand.${brand.id}.logoAlt`)}
                  className={cn(brand.logoClassName, "h-auto")}
                />
                <p className="text-center ds-text-base-6-normal whitespace-pre-line text-heading">
                  {t(`brand.${brand.id}.tagline`)}
                </p>
              </div>

              <Tabs
                value={tab}
                onValueChange={handleChangeTab}
                className="gap-0"
              >
                <TabsList variant="line" className="w-full">
                  {LOGIN_TABS.map((loginTab) => (
                    <TabsTrigger key={loginTab} value={loginTab}>
                      {loginTab === "partner"
                        ? t(`brand.${brand.id}.partnerTab`)
                        : t("creatorTab")}
                    </TabsTrigger>
                  ))}
                </TabsList>
                <TabsContent
                  value={tab}
                  className="flex flex-col ds-gap-6 ds-pt-10"
                >
                  {/* 탭이 바뀌면 입력값과 오류 문구를 비움. */}
                  <LoginForm
                    key={tab}
                    onAccountLocked={setLockedUserId}
                    onInterceptAction={openComingSoon}
                  />
                  <SnsLoginRow
                    onErrorStart={() => setSnsError("start")}
                    onFailLogin={() => setSnsError("login")}
                    onInterceptAction={openComingSoon}
                  />
                  {snsError && (
                    <p
                      role="alert"
                      className="text-center ds-text-sm-5-medium text-destructive"
                    >
                      {snsError === "start"
                        ? t("startFailed")
                        : t("loginFailed")}
                    </p>
                  )}
                  <Button
                    variant="outline-muted"
                    size="sm"
                    className="fixed bottom-5 left-1/2 h-8.5 -translate-x-1/2 self-center tablet:static tablet:left-auto tablet:translate-x-0 desktop:h-9"
                    onClick={handleClickBack}
                  >
                    <ChevronLeft />
                    {tCommon("action.goBack")}
                  </Button>
                </TabsContent>
              </Tabs>
            </>
          )}
        </div>
      </div>

      <LoginTermsLinks
        onClickPrivacy={() => terms.openTerms("privacy")}
        onClickTerms={() => terms.openTerms("service")}
      />
      <TermsDialog
        kind={terms.kind}
        isOpen={terms.isOpen}
        onClose={terms.closeTerms}
      />
      <LockedAlertDialog
        isOpen={lockedUserId !== null}
        onClose={() => setLockedUserId(null)}
      />
      <ComingSoonAlertDialog
        isOpen={isComingSoonOpen}
        onClose={() => setIsComingSoonOpen(false)}
      />
    </div>
  );
}
