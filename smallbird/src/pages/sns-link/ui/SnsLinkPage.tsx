import { useId, useState } from "react";
import { useLocation, useNavigate } from "react-router";

import { TermsDialog, useTermsDialog } from "@/features/view-terms";
import {
  AuthButton,
  AuthHeading,
  AuthInput,
  AuthSupportText,
  AuthTab,
  AuthTermsFooter,
  AuthText,
  AuthTextButton,
  PasswordInput,
} from "@/shared/components/auth";
import { ROUTES } from "@/shared/config";
import { Trans, useTranslation } from "@/shared/i18n";

import { linkAccount } from "../lib/link-account";
import { TABS } from "../model/constants";
import { snsLinkStateSchema } from "../model/schema";

import type { LinkErrorCode } from "../lib/link-account";
import type { Tab } from "../model/constants";

/**
 * 가입된 적 없는 SNS 계정으로 들어왔을 때(`NEED_SIGNUP`) 보여 줌. 새로 가입하거나,
 * 기존 계정으로 로그인해 SNS를 연동함.
 * 같은 탭 이동이라 신원 정보는 라우터 state로 전달함. URL에 담던 클라이언트
 * 서명 JWT는 서명 키가 번들에 들어 있어 없앰.
 */
export function SnsLinkPage() {
  const { t } = useTranslation("pages/sns-link");
  const { t: tCommon } = useTranslation();
  const { state } = useLocation();
  const navigate = useNavigate();
  const terms = useTermsDialog();
  const errorId = useId();

  const [tab, setTab] = useState<Tab>("signup");
  const [id, setId] = useState("");
  const [password, setPassword] = useState("");
  const [errorCode, setErrorCode] = useState<
    LinkErrorCode | "credentialRequired" | null
  >(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const parsedState = snsLinkStateSchema.safeParse(state);
  const snsData = parsedState.success ? parsedState.data.snsData : undefined;
  const passwordLabel = tCommon("field.password");

  async function handleSubmitLogin() {
    if (!id || !password) {
      setErrorCode("credentialRequired");
      return;
    }
    setErrorCode(null);
    // 로그인과 연동이 이어지는 요청이라 응답 전에 다시 누르면 중복 연동 요청이 나간다.
    setIsSubmitting(true);
    const result = await linkAccount(id, password, snsData).finally(() =>
      setIsSubmitting(false),
    );
    if (!result.isLinked) {
      setErrorCode(result.code);
      return;
    }
    // 승인 전 계정은 연동만 되고 세션은 열리지 않으므로 로그인 화면으로 보냄(승인 뒤 SNS로 로그인됨).
    void navigate(result.isSessionOpened ? ROUTES.main : ROUTES.login);
  }

  function handleClickTab(nextTab: Tab) {
    setTab(nextTab);
    setErrorCode(null);
  }

  function handleClickLogin() {
    void handleSubmitLogin();
  }

  function handleClickBack() {
    void navigate(ROUTES.login);
  }

  function handleClickSignup() {
    void navigate(ROUTES.join, { state: { tokenData: snsData ?? null } });
  }

  function handleClickFind() {
    void navigate(ROUTES.find);
  }

  return (
    <div className="relative flex min-h-dvh flex-col items-center bg-background">
      <title>{t("title")}</title>
      <div className="flex w-full max-w-96 flex-1 flex-col px-5 pt-16 pb-15 tablet:px-0 tablet:pt-17.5 desktop:pt-30">
        <div role="tablist" className="flex w-full">
          {TABS.map((item) => (
            <AuthTab
              key={item.key}
              isSelected={tab === item.key}
              label={t(item.labelKey)}
              onClick={() => handleClickTab(item.key)}
            />
          ))}
        </div>

        {tab === "signup" ? (
          <div
            role="tabpanel"
            aria-label={t("tab.signup")}
            className="flex w-full flex-col items-center"
          >
            <div className="mt-7.5 flex flex-col items-center gap-5 p-10 text-center tablet:mt-6">
              <AuthHeading type="headline-3" as="h1" tone="heading">
                {t("signup.heading")}
              </AuthHeading>
              <AuthText size="md">
                <Trans
                  t={t}
                  i18nKey="signup.message"
                  components={{ br: <br /> }}
                />
              </AuthText>
            </div>
            <div className="fixed bottom-5 left-1/2 h-12 w-80 -translate-x-1/2 tablet:static tablet:mt-12 tablet:w-full tablet:translate-x-0">
              <AuthButton color="primary" onClick={handleClickSignup}>
                <AuthText as="span" size="fixed-base" tone="inherit">
                  {t("signup.submit")}
                </AuthText>
              </AuthButton>
            </div>
            <AuthTextButton
              onClick={handleClickBack}
              className="fixed bottom-27 left-1/2 -translate-x-1/2 tablet:static tablet:mt-6 tablet:translate-x-0"
            >
              {tCommon("action.goBack")}
            </AuthTextButton>
          </div>
        ) : (
          <div
            role="tabpanel"
            aria-label={t("tab.link")}
            className="mt-10 flex w-full flex-col gap-10 tablet:mt-12 tablet:gap-12"
          >
            <div className="flex flex-col items-center gap-2.5 px-0 text-center tablet:gap-5 tablet:px-10">
              <AuthHeading type="subtitle-2" as="h1" tone="heading">
                {t("link.heading")}
              </AuthHeading>
              <AuthText size="md">
                <Trans
                  t={t}
                  i18nKey="link.message"
                  components={{ br: <br /> }}
                />
              </AuthText>
            </div>

            <div className="flex flex-col gap-5 tablet:gap-6">
              <div className="flex flex-col gap-10 tablet:gap-12">
                <div className="flex flex-col gap-2">
                  <div className="flex flex-col gap-2.5 tablet:gap-5">
                    <AuthInput
                      aria-label={tCommon("field.id")}
                      autoComplete="username"
                      placeholder={tCommon("field.id")}
                      value={id}
                      aria-describedby={errorCode ? errorId : undefined}
                      onChange={(event) => setId(event.target.value)}
                    />
                    <PasswordInput
                      label={passwordLabel}
                      autoComplete="current-password"
                      placeholder={passwordLabel}
                      value={password}
                      aria-describedby={errorCode ? errorId : undefined}
                      onChange={(event) => setPassword(event.target.value)}
                    />
                  </div>
                  {errorCode && (
                    <AuthSupportText id={errorId} state="error" role="alert">
                      {t(`error.${errorCode}`)}
                    </AuthSupportText>
                  )}
                </div>
                <div className="h-12 w-full">
                  <AuthButton
                    color="primary"
                    disabled={isSubmitting}
                    onClick={handleClickLogin}
                  >
                    <AuthText as="span" size="fixed-base" tone="inherit">
                      {tCommon("action.login")}
                    </AuthText>
                  </AuthButton>
                </div>
              </div>

              <div className="flex flex-col items-center gap-10 tablet:gap-12">
                <div className="flex items-center justify-center gap-5">
                  <AuthTextButton variant="plain" onClick={handleClickFind}>
                    {tCommon("link.findId")}
                  </AuthTextButton>
                  <div className="h-4 w-px shrink-0 bg-line1" />
                  <AuthTextButton variant="plain" onClick={handleClickFind}>
                    {tCommon("link.findPassword")}
                  </AuthTextButton>
                </div>
                <AuthTextButton onClick={handleClickBack}>
                  {tCommon("action.goBack")}
                </AuthTextButton>
              </div>
            </div>
          </div>
        )}
      </div>

      <AuthTermsFooter
        onClickPrivacy={() => terms.openTerms("privacy")}
        onClickTerms={() => terms.openTerms("service")}
      />
      <TermsDialog
        kind={terms.kind}
        isOpen={terms.isOpen}
        onClose={terms.closeTerms}
      />
    </div>
  );
}
