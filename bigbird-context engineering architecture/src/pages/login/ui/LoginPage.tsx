import { useState } from "react";
import { Link, useNavigate } from "react-router";

import { LoginForm, resolveBrand } from "@/features/login";
import { SnsLoginRow } from "@/features/social-login";
import moreHorizontal from "@/shared/assets/img/system/more-horizontal.svg";
import {
  AlertPopup,
  AuthTermsFooter,
  AuthText,
} from "@/shared/components/auth";
import { HISTORY_BACK, ROUTES, TERMS_LINKS } from "@/shared/config";
import { Trans, useTranslation } from "@/shared/i18n";
import { cn } from "@/shared/lib";

import { QuestionPanel } from "./QuestionPanel";

import type { CssVariableStyle } from "@/shared/lib";

/** `/logout`도 같은 화면을 보여 주므로 이 컴포넌트를 함께 씀. */
export function LoginPage() {
  const { t } = useTranslation("pages/login");
  const { t: tCommon } = useTranslation();
  const navigate = useNavigate();
  const brand = resolveBrand(window.location.hostname, window.location.search);

  const [isQuestionOpen, setIsQuestionOpen] = useState(false);
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const [lockedUserId, setLockedUserId] = useState<string | null>(null);
  const [hasSnsError, setHasSnsError] = useState(false);
  // 펫플레이는 브랜드색만 바뀜. --brand를 덮어쓰면 bg-brand와 caret-brand가 함께 바뀜.
  const brandStyle: CssVariableStyle | undefined = brand.primaryColor
    ? { "--brand": brand.primaryColor }
    : undefined;

  function handleSuccessKakao() {
    void navigate(ROUTES.authKakao);
  }

  function handleClickBack() {
    void navigate(HISTORY_BACK);
  }

  return (
    <div
      className="relative flex min-h-dvh items-center justify-center bg-background"
      style={brandStyle}
    >
      <title>{t("title")}</title>
      <div className="relative flex w-80 flex-col gap-4 tablet:w-96 tablet:gap-[30px]">
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

            <div className="fixed top-0 right-[calc((100vw-320px)/2)] tablet:hidden">
              <button
                type="button"
                aria-label={t("moreLabel")}
                aria-expanded={isMoreMenuOpen}
                onClick={() => setIsMoreMenuOpen((isOpen) => !isOpen)}
                className="absolute top-2.5 right-0 flex size-6 items-center justify-center"
              >
                <img src={moreHorizontal} alt="" className="h-[3px] w-[17px]" />
              </button>
              {isMoreMenuOpen && (
                <div className="absolute top-9 right-0 z-10 flex w-fit flex-col gap-1 rounded-auth-xl bg-light p-1 whitespace-nowrap shadow-normal">
                  {TERMS_LINKS.map((link) => (
                    <Link
                      key={link.to}
                      to={link.to}
                      className="flex h-8 items-center rounded-auth-lg px-1.5"
                    >
                      <AuthText as="span" size="sm">
                        {tCommon(link.labelKey)}
                      </AuthText>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            <div className="flex flex-col items-center gap-6">
              <img
                src={brand.logo}
                alt={t(`brand.${brand.id}.logoAlt`)}
                className={cn(brand.logoClassName, "h-auto")}
              />
              <AuthText
                size="md"
                tone="heading"
                className="text-center whitespace-pre-line"
              >
                {t(`brand.${brand.id}.tagline`)}
              </AuthText>
            </div>

            <div className="flex flex-col gap-5 tablet:gap-6">
              <LoginForm onAccountLocked={setLockedUserId} />
              <SnsLoginRow
                onSuccessKakao={handleSuccessKakao}
                onErrorStart={() => setHasSnsError(true)}
              />
              {hasSnsError && (
                <AuthText
                  size="sm"
                  tone="negative"
                  className="text-center"
                  role="alert"
                >
                  {t("startFailed")}
                </AuthText>
              )}
              <button
                type="button"
                onClick={handleClickBack}
                className="fixed bottom-5 left-1/2 -translate-x-1/2 self-center tablet:static tablet:left-auto tablet:translate-x-0"
              >
                <AuthText
                  as="span"
                  size="sm"
                  tone="lined"
                  className="border-b border-icon-lined"
                >
                  {tCommon("action.goBack")}
                </AuthText>
              </button>
            </div>
          </>
        )}
      </div>

      <AuthTermsFooter />

      {lockedUserId !== null && (
        <AlertPopup
          title={t("locked.title")}
          message={
            <Trans t={t} i18nKey="locked.message" components={{ br: <br /> }} />
          }
          confirmLabel={tCommon("action.confirm")}
          onClickConfirm={() => setLockedUserId(null)}
          isCloseButtonHidden
        />
      )}
    </div>
  );
}
