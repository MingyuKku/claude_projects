import { tryit } from "radash";
import { useState } from "react";
import { Link, useNavigate } from "react-router";

import {
  stashLoginCredential,
  useFormLogin,
  useNavigateToLanding,
} from "@/entities/session";
import { isApiError } from "@/shared/api";
import {
  AuthButton,
  AuthInput,
  AuthText,
  PasswordInput,
} from "@/shared/components/auth";
import { ROUTES } from "@/shared/config";
import { useTranslation } from "@/shared/i18n";

import { resolveBrand } from "../lib/brand";
import { mapLoginError, readLoginErrorData } from "../lib/login-error";
import { offerToSavePassword } from "../lib/save-credential";
import {
  FIND_ID_QUERY,
  FIND_PASSWORD_QUERY,
  JOIN_QUERY,
  STATUS_NO_RESPONSE,
} from "../model/constants";

import type { LoginMessage } from "../model/types";
import type { FormEvent } from "react";

interface LoginFormProps {
  onAccountLocked: (userId: string) => void;
}

export function LoginForm({ onAccountLocked }: LoginFormProps) {
  const { t } = useTranslation("features/login");
  const { t: tCommon } = useTranslation();
  const navigate = useNavigate();
  const brand = resolveBrand(window.location.hostname, window.location.search);
  const { trigger, isMutating } = useFormLogin();
  const navigateToLanding = useNavigateToLanding();

  const [id, setId] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<LoginMessage | null>(null);

  // 어느 필드가 틀렸는지 알 수 없는 에러는 두 입력창을 모두 빨갛게 표시함.
  const idState =
    message && message.code !== "passwordRequired" ? "error" : "default";
  const passwordState =
    message && message.code !== "idRequired" ? "error" : "default";

  async function submitLogin() {
    if (id === "") {
      setMessage({ code: "idRequired" });
      return;
    }
    if (password === "") {
      setMessage({ code: "passwordRequired" });
      return;
    }
    setMessage(null);

    const [error, data] = await tryit(trigger)({ username: id, password });

    if (error) {
      const mapped = isApiError(error)
        ? mapLoginError(error.status, readLoginErrorData(error.data), id)
        : mapLoginError(STATUS_NO_RESPONSE, undefined, id);

      if (mapped.isLocked) {
        onAccountLocked(id);
        return;
      }
      if (mapped.isExpired) {
        // 비밀번호를 라우터 state에 넣으면 히스토리로 디스크에 기록되므로 넣지 않음.
        stashLoginCredential({ id, password });
        void navigate(ROUTES.expired);
        return;
      }
      setMessage(mapped.message);
      return;
    }

    if (!data?.result) {
      setMessage({ code: "mismatch" });
      return;
    }
    offerToSavePassword(id, password);
    navigateToLanding();
  }

  // 브라우저 비밀번호 관리자는 폼 제출을 보고 저장을 제안하므로 <form> 제출로 로그인한다.
  // Enter 키도 폼이 처리한다.
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void submitLogin();
  }

  return (
    <div className="flex flex-col gap-6 tablet:gap-10">
      <div className="flex h-[54px] w-full shrink-0 items-center justify-center border-b-[3px] border-heading">
        <AuthText as="span" size="fixed-base" weight="medium" tone="heading">
          {t(`brand.${brand.id}.loginTitle`)}
        </AuthText>
      </div>

      <form className="flex flex-col" noValidate onSubmit={handleSubmit}>
        <div className="relative flex flex-col gap-2 pb-5 tablet:pb-12">
          <div className="relative flex flex-col gap-2.5 tablet:gap-5">
            <AuthInput
              name="loginId"
              autoComplete="username"
              aria-label={tCommon("field.id")}
              placeholder={tCommon("field.id")}
              value={id}
              state={idState}
              onChange={(event) => {
                setId(event.target.value);
                setMessage(null);
              }}
            />

            <PasswordInput
              name="password"
              autoComplete="current-password"
              label={tCommon("field.password")}
              placeholder={tCommon("field.password")}
              value={password}
              state={passwordState}
              onChange={(event) => {
                setPassword(event.target.value);
                setMessage(null);
              }}
            />
          </div>

          {message && (
            <AuthText
              size="sm"
              tone="negative"
              className="whitespace-pre-line"
              role="alert"
            >
              {t(`error.${message.code}`, message.values)}
            </AuthText>
          )}
        </div>

        <div className="mb-5 h-12 tablet:mb-6">
          <AuthButton color="primary" type="submit" disabled={isMutating}>
            <AuthText as="span" size="md" tone="inherit">
              {isMutating ? t("submitting") : tCommon("action.login")}
            </AuthText>
          </AuthButton>
        </div>

        <div className="flex items-center justify-center gap-5">
          <Link to={`${ROUTES.find}${FIND_ID_QUERY}`}>
            <AuthText size="sm" tone="heading">
              {tCommon("link.findId")}
            </AuthText>
          </Link>
          <div className="h-4 w-px shrink-0 bg-gray-200" />
          <Link to={`${ROUTES.find}${FIND_PASSWORD_QUERY}`}>
            <AuthText size="sm" tone="heading">
              {tCommon("link.findPassword")}
            </AuthText>
          </Link>
          <div className="h-4 w-px shrink-0 bg-gray-200" />
          <Link to={`${ROUTES.join}${JOIN_QUERY}`}>
            <AuthText size="sm" tone="heading">
              {tCommon("link.signup")}
            </AuthText>
          </Link>
        </div>
      </form>
    </div>
  );
}
