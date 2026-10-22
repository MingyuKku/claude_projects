import { cva } from "class-variance-authority";
import { useState } from "react";
import { useLocation, useNavigate } from "react-router";

import {
  AuthButton,
  AuthInput,
  AuthTab,
  AuthTermsFooter,
  AuthText,
  PasswordInput,
} from "@/shared/components/auth";
import { ROUTES } from "@/shared/config";
import { Trans, useTranslation } from "@/shared/i18n";

import { linkAccount } from "../lib/link-account";
import { TABS } from "../model/constants";
import { snsLinkStateSchema } from "../model/schema";

import type { LinkErrorCode } from "../lib/link-account";
import type { Tab } from "../model/constants";

const contentVariants = cva(
  "flex w-80 flex-col items-center gap-10 pt-16 tablet:w-96 tablet:pt-[70px] desktop:pt-[120px]",
  {
    variants: {
      tab: { signup: "tablet:gap-6", link: "tablet:gap-12" },
    },
  },
);

/**
 * 가입된 적 없는 SNS 계정으로 들어왔을 때(C02) 보여 줌. 새로 가입하거나,
 * 기존 계정으로 로그인해 SNS를 연동함.
 * 같은 탭 이동이라 신원 정보는 라우터 state로 전달함. URL에 담던 클라이언트
 * 서명 JWT는 서명 키가 번들에 들어 있어 없앰.
 */
export function SnsLinkPage() {
  const { t } = useTranslation("pages/sns-link");
  const { t: tCommon } = useTranslation();
  const { state } = useLocation();
  const navigate = useNavigate();

  const [tab, setTab] = useState<Tab>("signup");
  const [id, setId] = useState("");
  const [password, setPassword] = useState("");
  const [errorCode, setErrorCode] = useState<
    LinkErrorCode | "credentialRequired" | null
  >(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const parsedState = snsLinkStateSchema.safeParse(state);
  const snsData = parsedState.success ? parsedState.data.snsData : undefined;

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
    void navigate(ROUTES.main);
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
    <div className="relative flex min-h-dvh items-start justify-center bg-background">
      <title>{t("title")}</title>
      <div className={contentVariants({ tab })}>
        <div role="tablist" className="flex w-full">
          {TABS.map((item) => (
            <AuthTab
              key={item.key}
              isSelected={tab === item.key}
              label={t(item.labelKey)}
              onClick={() => setTab(item.key)}
            />
          ))}
        </div>

        {tab === "signup" ? (
          <div className="flex w-full flex-col items-center gap-12">
            <div className="flex flex-col items-center gap-5 p-10 text-center">
              <AuthText size="xl" weight="bold" tone="heading">
                {t("signup.heading")}
              </AuthText>
              <AuthText size="md">
                <Trans
                  t={t}
                  i18nKey="signup.message"
                  components={{ br: <br /> }}
                />
              </AuthText>
            </div>
            <div className="fixed bottom-5 left-1/2 h-12 w-80 -translate-x-1/2 tablet:static tablet:left-auto tablet:w-full tablet:translate-x-0">
              <AuthButton color="primary" onClick={handleClickSignup}>
                <AuthText as="span" tone="inherit">
                  {t("signup.submit")}
                </AuthText>
              </AuthButton>
            </div>
          </div>
        ) : (
          <div className="flex w-full flex-col items-center gap-5 tablet:gap-6">
            <div className="flex w-full flex-col items-center gap-10 tablet:gap-12">
              <div className="flex flex-col items-center gap-2.5 px-0 text-center tablet:gap-5 tablet:px-10">
                <AuthText size="xl" weight="bold" tone="heading">
                  {t("link.heading")}
                </AuthText>
                <AuthText size="md">
                  <Trans
                    t={t}
                    i18nKey="link.message"
                    components={{ br: <br /> }}
                  />
                </AuthText>
              </div>
              <div className="flex w-full flex-col gap-2.5 tablet:gap-5">
                <div className="h-11">
                  <AuthInput
                    aria-label={tCommon("field.id")}
                    autoComplete="username"
                    placeholder={tCommon("field.id")}
                    value={id}
                    onChange={(event) => setId(event.target.value)}
                  />
                </div>
                <PasswordInput
                  label={tCommon("field.password")}
                  autoComplete="current-password"
                  placeholder={tCommon("field.password")}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                />
              </div>
              {errorCode && (
                <AuthText size="sm" role="alert" tone="negative">
                  {t(`error.${errorCode}`)}
                </AuthText>
              )}
              <div className="h-12 w-full">
                <AuthButton
                  color="primary"
                  disabled={isSubmitting}
                  onClick={handleClickLogin}
                >
                  <AuthText as="span" tone="inherit">
                    {tCommon("action.login")}
                  </AuthText>
                </AuthButton>
              </div>
            </div>

            <div className="flex flex-col items-center gap-10 tablet:gap-6 desktop:gap-12">
              <div className="flex items-center justify-center gap-5">
                <button type="button" onClick={handleClickFind}>
                  <AuthText as="span" size="sm">
                    {tCommon("link.findId")}
                  </AuthText>
                </button>
                <div className="h-4 w-px shrink-0 bg-gray-200" />
                <button type="button" onClick={handleClickFind}>
                  <AuthText as="span" size="sm">
                    {tCommon("link.findPassword")}
                  </AuthText>
                </button>
              </div>
              <button
                type="button"
                onClick={handleClickBack}
                className="border-b border-gray-300"
              >
                {/* 원본은 `!` 없이 text-gray-400을 넘겨서 AuthText 기본 gray-700이 이김.
                    렌더 색을 유지하려고 색 클래스를 주지 않음. 줄 경우 `cn`이 뒤 클래스를
                    이겨 색이 바뀜. */}
                <AuthText as="span" size="sm">
                  {tCommon("action.goBack")}
                </AuthText>
              </button>
            </div>
          </div>
        )}

        {tab === "signup" && (
          <button
            type="button"
            onClick={handleClickBack}
            className="fixed bottom-[108px] left-1/2 -translate-x-1/2 border-b border-gray-300 tablet:static tablet:left-auto tablet:translate-x-0"
          >
            {/* 위와 같은 이유로 색 클래스 없이 gray-700으로 렌더됨. */}
            <AuthText as="span" size="sm">
              {tCommon("action.goBack")}
            </AuthText>
          </button>
        )}
      </div>

      <AuthTermsFooter />
    </div>
  );
}
