import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router";

import { socialLoginPayloadSchema } from "@/features/social-login";
import {
  AuthButton,
  AuthInput,
  AuthText,
  PasswordInput,
} from "@/shared/components/auth";
import { ROUTES } from "@/shared/config";
import { cn } from "@/shared/lib";

import { linkAccount } from "../lib/link-account";
import {
  CREDENTIAL_REQUIRED_MESSAGE,
  TABS,
  TERMS_LINKS,
} from "../model/constants";

import type { Tab } from "../model/constants";

/**
 * Shown when a user arrives with an SNS account that was never registered (C02):
 * either sign up, or log in to an existing account and link the SNS to it.
 * The identity travels in router state because it is a same-tab navigation; the
 * old client-signed JWT in the URL was dropped since its key shipped in the bundle.
 */
export function SnsLinkPage() {
  const { state } = useLocation();
  const parsedState = socialLoginPayloadSchema.safeParse(
    (state as { snsData?: unknown } | null)?.snsData,
  );
  const snsData = parsedState.success ? parsedState.data : undefined;
  const navigate = useNavigate();

  const [tab, setTab] = useState<Tab>("signup");
  const [id, setId] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  async function handleSubmitLogin() {
    if (!id || !password) {
      setMessage(CREDENTIAL_REQUIRED_MESSAGE);
      return;
    }
    setMessage("");
    const result = await linkAccount(id, password, snsData);
    if (!result.isLinked) {
      setMessage(result.message);
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
      <title>SNS 계정 연동</title>
      <div
        className={cn(
          "flex w-80 flex-col items-center pt-16 tablet:w-96 tablet:pt-[70px] desktop:pt-[120px]",
          tab === "signup" ? "gap-10 tablet:gap-6" : "gap-10 tablet:gap-12",
        )}
      >
        <div role="tablist" className="flex w-full">
          {TABS.map((item) => {
            const isSelected = tab === item.key;
            return (
              <button
                key={item.key}
                type="button"
                role="tab"
                aria-selected={isSelected}
                onClick={() => setTab(item.key)}
                className={cn(
                  "flex h-[54px] flex-1 items-center justify-center border-b",
                  isSelected
                    ? "border-b-[3px] border-brand"
                    : "border-gray-200",
                )}
              >
                <AuthText
                  as="span"
                  size="lg"
                  weight={isSelected ? "bold" : "normal"}
                  className="text-heading"
                >
                  {item.label}
                </AuthText>
              </button>
            );
          })}
        </div>

        {tab === "signup" ? (
          <div className="flex w-full flex-col items-center gap-12">
            <div className="flex flex-col items-center gap-5 p-10 text-center">
              <AuthText size="xl" weight="bold" className="text-heading">
                반가워요.
              </AuthText>
              <AuthText size="md">
                빅버드 파트너가 되어주시겠어요?
                <br />
                회원가입 이후에는 SNS 계정으로
                <br />
                로그인이 가능해요.
              </AuthText>
            </div>
            <div className="fixed bottom-5 left-1/2 h-12 w-80 -translate-x-1/2 tablet:static tablet:left-auto tablet:w-full tablet:translate-x-0">
              <AuthButton color="primary" onClick={handleClickSignup}>
                <AuthText as="span" className="text-inherit!">
                  가입하기
                </AuthText>
              </AuthButton>
            </div>
          </div>
        ) : (
          <div className="flex w-full flex-col items-center gap-5 tablet:gap-6">
            <div className="flex w-full flex-col items-center gap-10 tablet:gap-12">
              <div className="flex flex-col items-center gap-2.5 px-0 text-center tablet:gap-5 tablet:px-10">
                <AuthText size="xl" weight="bold" className="text-heading">
                  빅버드 기업회원 로그인
                </AuthText>
                <AuthText size="md">
                  기존 빅버드 파트너라면 로그인 시
                  <br />
                  SNS계정이 자동으로 연동돼요.
                </AuthText>
              </div>
              <div className="flex w-full flex-col gap-2.5 tablet:gap-5">
                <div className="h-11">
                  <AuthInput
                    aria-label="아이디"
                    autoComplete="username"
                    placeholder="아이디"
                    value={id}
                    onChange={(event) => setId(event.target.value)}
                  />
                </div>
                <PasswordInput
                  label="비밀번호"
                  autoComplete="current-password"
                  placeholder="비밀번호"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                />
              </div>
              {message && (
                <AuthText size="sm" role="alert" className="text-negative">
                  {message}
                </AuthText>
              )}
              <div className="h-12 w-full">
                <AuthButton color="primary" onClick={handleClickLogin}>
                  <AuthText as="span" className="text-inherit!">
                    로그인
                  </AuthText>
                </AuthButton>
              </div>
            </div>

            <div className="flex flex-col items-center gap-10 tablet:gap-6 desktop:gap-12">
              <div className="flex items-center justify-center gap-5">
                <button type="button" onClick={handleClickFind}>
                  <AuthText as="span" size="sm">
                    아이디 찾기
                  </AuthText>
                </button>
                <div className="h-4 w-px shrink-0 bg-gray-200" />
                <button type="button" onClick={handleClickFind}>
                  <AuthText as="span" size="sm">
                    비밀번호 찾기
                  </AuthText>
                </button>
              </div>
              <button
                type="button"
                onClick={handleClickBack}
                className="border-b border-gray-300"
              >
                {/* The source passed text-gray-400 without `!`, so AuthText's default
                    gray-700 won the cascade. Keep the rendered color: `cn` would let
                    the later class win and change it. */}
                <AuthText as="span" size="sm">
                  되돌아가기
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
            {/* Same reason as above: no color class, rendered gray-700. */}
            <AuthText as="span" size="sm">
              되돌아가기
            </AuthText>
          </button>
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
    </div>
  );
}
