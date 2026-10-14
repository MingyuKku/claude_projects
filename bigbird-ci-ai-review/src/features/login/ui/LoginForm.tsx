import { tryit } from "radash";
import { useState } from "react";
import { Link, useNavigate } from "react-router";

import {
  landingDestination,
  stashLoginCredential,
  useFormLogin,
} from "@/entities/session";
import { isApiError } from "@/shared/api";
import {
  AuthButton,
  AuthInput,
  AuthText,
  PasswordInput,
} from "@/shared/components/auth";
import { ROUTES } from "@/shared/config";

import { resolveBrand } from "../lib/brand";
import { mapLoginError } from "../lib/login-error";
import {
  ENTER_KEY,
  FIND_ID_QUERY,
  FIND_PASSWORD_QUERY,
  ID_REQUIRED_MESSAGE,
  JOIN_QUERY,
  MISMATCH_MESSAGE,
  PASSWORD_REQUIRED_MESSAGE,
} from "../model/constants";

import type { LoginErrorData } from "../model/types";
import type { KeyboardEvent } from "react";

interface LoginFormProps {
  onAccountLocked: (userId: string) => void;
}

export function LoginForm({ onAccountLocked }: LoginFormProps) {
  const navigate = useNavigate();
  const brand = resolveBrand(window.location.hostname, window.location.search);
  const { trigger, isMutating } = useFormLogin();

  const [id, setId] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  function goToLanding(authority: string | undefined) {
    const destination = landingDestination(authority);
    if (destination.kind === "internal") {
      void navigate(destination.path);
      return;
    }
    // Legacy-app paths need a server round trip, so `navigate` cannot reach them.
    window.location.href = destination.path;
  }

  async function handleSubmit() {
    if (id === "") {
      setMessage(ID_REQUIRED_MESSAGE);
      return;
    }
    if (password === "") {
      setMessage(PASSWORD_REQUIRED_MESSAGE);
      return;
    }
    setMessage("");

    const [error, data] = await tryit(trigger)({ username: id, password });

    if (error) {
      const mapped = isApiError(error)
        ? mapLoginError(error.status, error.data as LoginErrorData, id)
        : mapLoginError(0, undefined, id);

      if (mapped.locked) {
        onAccountLocked(id);
        return;
      }
      if (mapped.expired) {
        // Never put the password in router state: it would be written to history on disk.
        stashLoginCredential({ id, password });
        void navigate(ROUTES.expired);
        return;
      }
      setMessage(mapped.message);
      return;
    }

    if (!data?.result) {
      setMessage(MISMATCH_MESSAGE);
      return;
    }
    goToLanding(data.authority);
  }

  function handleKeyUp(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === ENTER_KEY) void handleSubmit();
  }

  function handleClickLogin() {
    void handleSubmit();
  }

  // An error that cannot tell which field is wrong turns both fields red.
  const idState =
    message && message !== PASSWORD_REQUIRED_MESSAGE ? "error" : "default";
  const passwordState =
    message && message !== ID_REQUIRED_MESSAGE ? "error" : "default";

  return (
    <div className="flex flex-col gap-6 tablet:gap-10">
      <div className="flex h-[54px] w-full shrink-0 items-center justify-center border-b-[3px] border-heading">
        <AuthText
          as="span"
          size="lg"
          weight="medium"
          className="text-base! text-heading!"
        >
          {brand.loginTitle}
        </AuthText>
      </div>

      <div className="flex flex-col">
        <div className="relative flex flex-col gap-2 pb-5 tablet:pb-12">
          <div className="relative flex flex-col gap-2.5 tablet:gap-5">
            <AuthInput
              name="loginId"
              autoComplete="username"
              aria-label="아이디"
              placeholder="아이디"
              value={id}
              state={idState}
              onChange={(event) => {
                setId(event.target.value);
                setMessage("");
              }}
              onKeyUp={handleKeyUp}
            />

            <PasswordInput
              name="password"
              autoComplete="current-password"
              label="비밀번호"
              placeholder="비밀번호"
              value={password}
              state={passwordState}
              onChange={(event) => {
                setPassword(event.target.value);
                setMessage("");
              }}
              onKeyUp={handleKeyUp}
            />
          </div>

          {message && (
            <AuthText
              size="sm"
              className="whitespace-pre-line text-negative!"
              role="alert"
            >
              {message}
            </AuthText>
          )}
        </div>

        <div className="mb-5 h-12 tablet:mb-6">
          <AuthButton
            color="primary"
            onClick={handleClickLogin}
            disabled={isMutating}
          >
            <AuthText as="span" size="md" className="text-inherit!">
              {isMutating ? "로그인 중" : "로그인"}
            </AuthText>
          </AuthButton>
        </div>

        <div className="flex items-center justify-center gap-5">
          <Link to={`${ROUTES.find}${FIND_ID_QUERY}`}>
            <AuthText size="sm" className="text-heading!">
              아이디 찾기
            </AuthText>
          </Link>
          <div className="h-4 w-px shrink-0 bg-gray-200" />
          <Link to={`${ROUTES.find}${FIND_PASSWORD_QUERY}`}>
            <AuthText size="sm" className="text-heading!">
              비밀번호 찾기
            </AuthText>
          </Link>
          <div className="h-4 w-px shrink-0 bg-gray-200" />
          <Link to={`${ROUTES.join}${JOIN_QUERY}`}>
            <AuthText size="sm" className="text-heading!">
              회원가입
            </AuthText>
          </Link>
        </div>
      </div>
    </div>
  );
}
