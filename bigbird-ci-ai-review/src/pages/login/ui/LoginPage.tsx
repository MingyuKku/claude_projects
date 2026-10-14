import { useState } from "react";
import { Link, useNavigate } from "react-router";

import { LoginForm, resolveBrand } from "@/features/login";
import { SnsLoginRow } from "@/features/social-login";
import moreHorizontal from "@/shared/assets/img/system/more-horizontal.svg";
import { AlertPopup, AuthText } from "@/shared/components/auth";
import { ROUTES } from "@/shared/config";
import { cn } from "@/shared/lib";

import { HISTORY_BACK, TERMS_LINKS } from "../model/constants";
import { QuestionPanel } from "./QuestionPanel";

import type { CSSProperties } from "react";

/** Also rendered for `/logout`, which shows the same screen. */
export function LoginPage() {
  const navigate = useNavigate();
  const brand = resolveBrand(window.location.hostname, window.location.search);

  const [isQuestionOpen, setIsQuestionOpen] = useState(false);
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const [lockedUserId, setLockedUserId] = useState<string | null>(null);
  const [snsError, setSnsError] = useState("");

  function handleSuccessKakao() {
    void navigate(ROUTES.authKakao);
  }

  function handleClickBack() {
    void navigate(HISTORY_BACK);
  }

  return (
    <div
      className="relative flex min-h-dvh items-center justify-center bg-background"
      // Petplay only changes the brand color: overriding --brand carries bg-brand and caret-brand.
      style={
        brand.primaryColor
          ? ({ "--brand": brand.primaryColor } as CSSProperties)
          : undefined
      }
    >
      <title>로그인</title>
      <div className="relative flex w-80 flex-col gap-4 tablet:w-96 tablet:gap-[30px]">
        {isQuestionOpen ? (
          <QuestionPanel onClickClose={() => setIsQuestionOpen(false)} />
        ) : (
          <>
            {brand.showQuestion && (
              <button
                type="button"
                aria-label="문의"
                onClick={() => setIsQuestionOpen(true)}
                // `icon-questions` has no CSS definition in the source either, so nothing is
                // drawn. Needs a design decision.
                className="icon-questions absolute top-2.5 right-11 tablet:top-0 tablet:right-0"
              />
            )}

            <div className="fixed top-0 right-[calc((100vw-320px)/2)] tablet:hidden">
              <button
                type="button"
                aria-label="더보기"
                aria-expanded={isMoreMenuOpen}
                onClick={() => setIsMoreMenuOpen((isOpen) => !isOpen)}
                className="absolute top-2.5 right-0 flex size-6 items-center justify-center"
              >
                <img src={moreHorizontal} alt="" className="h-[3px] w-[17px]" />
              </button>
              {isMoreMenuOpen && (
                <div className="absolute top-9 right-0 z-10 flex w-fit flex-col gap-1 rounded-xl bg-light p-1 whitespace-nowrap shadow-normal">
                  {TERMS_LINKS.map((link) => (
                    <Link
                      key={link.to}
                      to={link.to}
                      className="flex h-8 items-center rounded-lg px-1.5"
                    >
                      <AuthText as="span" size="sm">
                        {link.label}
                      </AuthText>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            <div className="flex flex-col items-center gap-6">
              <img
                src={brand.logo}
                alt={brand.logoAlt}
                className={cn(brand.logoClassName, "h-auto")}
              />
              <AuthText
                size="md"
                className="text-center whitespace-pre-line text-heading!"
              >
                {brand.tagline}
              </AuthText>
            </div>

            <div className="flex flex-col gap-5 tablet:gap-6">
              <LoginForm onAccountLocked={setLockedUserId} />
              <SnsLoginRow
                onSuccessKakao={handleSuccessKakao}
                onErrorStart={setSnsError}
              />
              {snsError && (
                <AuthText
                  size="sm"
                  className="text-center text-negative!"
                  role="alert"
                >
                  {snsError}
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
                  className="border-b border-icon-lined text-icon-lined!"
                >
                  되돌아가기
                </AuthText>
              </button>
            </div>
          </>
        )}
      </div>

      <footer className="absolute bottom-5 hidden items-center gap-10 tablet:flex">
        {TERMS_LINKS.map((link) => (
          <Link key={link.to} to={link.to}>
            <AuthText size="sm" className="text-heading!">
              {link.label}
            </AuthText>
          </Link>
        ))}
      </footer>

      {lockedUserId !== null && (
        <AlertPopup
          title="빅버드 광고주 회원 검토중"
          message={
            <>
              빅링크 운영팀에서 광고주 회원 승인을 위해 기업 정보를
              검토중이에요.
              <br />
              빠르게 검토 후 연락처로 안내드릴게요.
            </>
          }
          confirmLabel="확인"
          onClickConfirm={() => setLockedUserId(null)}
          hideCloseButton
        />
      )}
    </div>
  );
}
