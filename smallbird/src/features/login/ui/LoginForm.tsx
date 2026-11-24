import { tryit } from "radash";
import { useId, useState } from "react";
import { Link, useNavigate } from "react-router";

import {
  stashLoginCredential,
  useFormLogin,
  useNavigateToLanding,
} from "@/entities/session";
import { isApiError } from "@/shared/api";
import { PasswordInput } from "@/shared/components/form-field";
import { ROUTES } from "@/shared/config";
import { useTranslation } from "@/shared/i18n";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Separator } from "@/shared/ui/separator";

import { mapLoginError, readLoginErrorData } from "../lib/login-error";
import { offerToSavePassword } from "../lib/save-credential";
import {
  FIND_ID_QUERY,
  FIND_PASSWORD_QUERY,
  JOIN_QUERY,
  STATUS_NO_RESPONSE,
} from "../model/constants";

import type { LoginMessage } from "../model/types";
import type { FormEvent, MouseEvent } from "react";

interface LoginFormProps {
  onAccountLocked: (userId: string) => void;
  /** 주면 로그인·찾기·가입 동작 대신 이것만 호출함(서버 호출·검증·이동 없음). */
  onInterceptAction?: () => void;
}

export function LoginForm({
  onAccountLocked,
  onInterceptAction,
}: LoginFormProps) {
  const { t } = useTranslation("features/login");
  const { t: tCommon } = useTranslation();
  const navigate = useNavigate();
  const { trigger, isMutating } = useFormLogin();
  const navigateToLanding = useNavigateToLanding();
  const messageId = useId();

  const [id, setId] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<LoginMessage | null>(null);

  // 어느 필드가 틀렸는지 알 수 없는 에러는 두 입력창을 모두 오류로 표시함.
  const isIdInvalid = message !== null && message.code !== "passwordRequired";
  const isPasswordInvalid = message !== null && message.code !== "idRequired";
  const passwordLabel = tCommon("field.password");

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
    if (onInterceptAction) {
      onInterceptAction();
      return;
    }
    void submitLogin();
  }

  function handleClickLink(event: MouseEvent<HTMLAnchorElement>) {
    if (!onInterceptAction) return;
    event.preventDefault();
    onInterceptAction();
  }

  return (
    <form
      className="flex flex-col ds-gap-12"
      noValidate
      onSubmit={handleSubmit}
    >
      <div className="flex flex-col ds-gap-3">
        <Input
          name="loginId"
          autoComplete="username"
          aria-label={tCommon("field.id")}
          className="aria-invalid:border-destructive"
          aria-invalid={isIdInvalid || undefined}
          aria-describedby={isIdInvalid ? messageId : undefined}
          placeholder={tCommon("field.id")}
          value={id}
          onChange={(event) => {
            setId(event.target.value);
            setMessage(null);
          }}
        />

        <div className="flex flex-col gap-2">
          <PasswordInput
            name="password"
            autoComplete="current-password"
            aria-label={passwordLabel}
            className="aria-invalid:border-destructive"
            aria-invalid={isPasswordInvalid || undefined}
            aria-describedby={isPasswordInvalid ? messageId : undefined}
            placeholder={passwordLabel}
            value={password}
            showLabel={tCommon("password.show", { label: passwordLabel })}
            hideLabel={tCommon("password.hide", { label: passwordLabel })}
            onChange={(event) => {
              setPassword(event.target.value);
              setMessage(null);
            }}
          />

          {message && (
            <p
              id={messageId}
              role="alert"
              className="ds-text-sm-5-medium whitespace-pre-line text-destructive"
            >
              {t(`error.${message.code}`, message.values)}
            </p>
          )}
        </div>
      </div>

      <div className="flex flex-col ds-gap-6">
        <Button
          type="submit"
          disabled={isMutating}
          className="h-9.5 desktop:h-10"
        >
          {isMutating ? t("submitting") : tCommon("action.login")}
        </Button>

        <div className="flex items-center justify-center ds-gap-3">
          <Button
            asChild
            variant="ghost-foreground"
            size="sm"
            className="h-8.5 desktop:h-9"
          >
            <Link
              to={`${ROUTES.find}${FIND_ID_QUERY}`}
              onClick={handleClickLink}
            >
              {tCommon("link.findId")}
            </Link>
          </Button>
          <Separator
            orientation="vertical"
            className="data-[orientation=vertical]:h-6"
          />
          <Button
            asChild
            variant="ghost-foreground"
            size="sm"
            className="h-8.5 desktop:h-9"
          >
            <Link
              to={`${ROUTES.find}${FIND_PASSWORD_QUERY}`}
              onClick={handleClickLink}
            >
              {tCommon("link.findPassword")}
            </Link>
          </Button>
          <Separator
            orientation="vertical"
            className="data-[orientation=vertical]:h-6"
          />
          <Button
            asChild
            variant="ghost-foreground"
            size="sm"
            className="h-8.5 desktop:h-9"
          >
            <Link to={`${ROUTES.join}${JOIN_QUERY}`} onClick={handleClickLink}>
              {tCommon("link.signup")}
            </Link>
          </Button>
        </div>
      </div>
    </form>
  );
}
