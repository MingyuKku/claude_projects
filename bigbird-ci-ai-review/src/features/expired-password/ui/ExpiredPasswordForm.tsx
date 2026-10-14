import { tryit } from "radash";
import { useState } from "react";
import { useNavigate } from "react-router";

import {
  clearLoginCredential,
  formLogin,
  landingDestination,
  readLoginCredential,
} from "@/entities/session";
import { isApiError } from "@/shared/api";
import {
  AuthButton,
  AuthHeader,
  AuthText,
  PasswordInput,
} from "@/shared/components/auth";
import { ROUTES } from "@/shared/config";
import { cn } from "@/shared/lib";

import { useChangeExpiredPassword } from "../api/use-change-expired-password";
import { useDelayExpiredPassword } from "../api/use-delay-expired-password";
import {
  mapExpiredError,
  readExpiredErrorReason,
} from "../lib/map-expired-error";
import { isValidNewPassword } from "../lib/validate-new-password";
import {
  DELAY_ERROR_MESSAGE,
  PASSWORD_FORMAT_ERROR,
  PASSWORD_HINT,
  PASSWORD_MISMATCH,
  SUBMIT_REQUIRED_MESSAGE,
  UNKNOWN_ERROR_MESSAGE,
} from "../model/constants";

import type { ChangeEvent } from "react";

interface Props {
  className?: string;
}

/**
 * Shown for accounts whose password is older than six months. The login page sends
 * the user here with the id and password held in memory, not router state (see
 * `login-handoff` in `@/entities/session`).
 */
export function ExpiredPasswordForm({ className }: Props) {
  const { id, password } = readLoginCredential() ?? {};
  const navigate = useNavigate();

  const { trigger: changeExpired, isMutating: isChanging } =
    useChangeExpiredPassword();
  const { trigger: delayExpired, isMutating: isDelaying } =
    useDelayExpiredPassword();

  const [originPassword, setOriginPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newPasswordCheck, setNewPasswordCheck] = useState("");
  const [isOriginWrong, setIsOriginWrong] = useState(false);
  const [newPasswordError, setNewPasswordError] = useState<string | null>(null);
  const [newPasswordCheckError, setNewPasswordCheckError] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  const goToLogin = () => navigate(ROUTES.login);

  const handleChangeOrigin = (event: ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setOriginPassword(value);
    // UX hint against the value used for the previous login; the server does the real check.
    setIsOriginWrong(value !== "" && value !== password);
  };

  const handleChangeNew = (event: ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setNewPassword(value);
    if (!value) {
      setNewPasswordError(null);
    } else {
      setNewPasswordError(
        isValidNewPassword(value) ? null : PASSWORD_FORMAT_ERROR,
      );
    }
    if (newPasswordCheck) {
      setNewPasswordCheckError(
        value === newPasswordCheck ? "" : PASSWORD_MISMATCH,
      );
    }
  };

  const handleChangeCheck = (event: ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setNewPasswordCheck(value);
    setNewPasswordCheckError(
      value && value !== newPassword ? PASSWORD_MISMATCH : "",
    );
  };

  const canSubmit = Boolean(
    originPassword &&
    newPassword &&
    newPasswordCheck &&
    !newPasswordError &&
    !newPasswordCheckError,
  );

  /** Continues the login the user originally wanted after postponing the change. */
  const relogin = async () => {
    if (!id || !password) {
      goToLogin();
      return;
    }
    const [error, data] = await tryit(formLogin)(id, password);
    clearLoginCredential();
    if (error || !data.result) {
      goToLogin();
      return;
    }
    const destination = landingDestination(data.authority);
    if (destination.kind === "internal") {
      navigate(destination.path);
    } else {
      // The legacy app is a separate page load; SPA navigation cannot reach it.
      window.location.href = destination.path;
    }
  };

  const handleSubmit = async () => {
    if (!id) {
      goToLogin();
      return;
    }
    if (!canSubmit) {
      setSubmitError(SUBMIT_REQUIRED_MESSAGE);
      return;
    }
    setSubmitError("");
    const [error, data] = await tryit(changeExpired)({
      id,
      originPW: originPassword,
      newPW: newPassword,
      newPWCheck: newPasswordCheck,
    });
    if (error) {
      const reason = isApiError(error)
        ? readExpiredErrorReason(error.data)
        : undefined;
      setSubmitError(mapExpiredError(reason));
      return;
    }
    if (!data?.result) {
      setSubmitError(UNKNOWN_ERROR_MESSAGE);
      return;
    }
    clearLoginCredential();
    setIsSuccess(true);
  };

  const handleDelay = async () => {
    if (!id) {
      goToLogin();
      return;
    }
    const [error] = await tryit(delayExpired)(id);
    if (error) {
      setSubmitError(DELAY_ERROR_MESSAGE);
      return;
    }
    await relogin();
  };

  if (isSuccess) {
    return (
      <div
        className={cn(
          "flex min-h-dvh items-center justify-center bg-background",
          className,
        )}
      >
        <div className="flex w-80 flex-col items-center gap-6 text-center tablet:w-96">
          <AuthText size="lg" weight="bold">
            비밀번호 변경 완료
          </AuthText>
          <AuthText size="sm">
            비밀번호 변경이 완료되었습니다.
            <br />
            계정보안을 위해 기존 로그인된 디바이스는 로그아웃했습니다.
            <br />
            다시 로그인 해주시기 바랍니다.
          </AuthText>
          <div className="h-12 w-full">
            <AuthButton color="primary" onClick={goToLogin}>
              <AuthText as="span">로그인하기</AuthText>
            </AuthButton>
          </div>
        </div>
      </div>
    );
  }

  return (
    <main
      className={cn(
        "flex min-h-dvh flex-col items-center gap-5 bg-background",
        className,
      )}
    >
      <AuthHeader title="비밀번호를 변경해주세요" onClickBack={goToLogin} />

      <div className="flex w-80 flex-1 flex-col pb-40 tablet:w-96 tablet:pb-0">
        <div className="flex flex-1 flex-col tablet:flex-none tablet:gap-12">
          <div className="flex flex-col gap-5 tablet:gap-12">
            <AuthText size="md">
              소중한 개인정보보호를 위해 비밀번호 변경이 필요합니다.
              <br />
              비밀번호를 변경한지 6개월이 경과되어 안내해드리며, 다음에
              변경하기를 누르시면 6개월 후 재안내드립니다.
            </AuthText>

            <div className="flex flex-col gap-5">
              <div className="flex flex-col gap-2">
                <AuthText size="md">현재 비밀번호</AuthText>
                <PasswordInput
                  label="현재 비밀번호"
                  autoComplete="current-password"
                  placeholder="영문, 숫자 포함 8자리 이상"
                  value={originPassword}
                  state={isOriginWrong ? "error" : "default"}
                  onChange={handleChangeOrigin}
                />
                {isOriginWrong && (
                  <AuthText size="sm" role="alert" className="text-negative!">
                    현재 비밀번호가 아닙니다. 다시 입력해주세요.
                  </AuthText>
                )}
              </div>

              <div className="flex flex-col gap-2">
                <AuthText size="md">새 비밀번호</AuthText>
                <PasswordInput
                  label="새 비밀번호"
                  autoComplete="new-password"
                  placeholder="영문, 숫자 포함 8자리 이상"
                  value={newPassword}
                  state={newPasswordError ? "error" : "default"}
                  onChange={handleChangeNew}
                />
                <AuthText
                  size="sm"
                  className={
                    newPasswordError ? "text-negative!" : "text-gray-400!"
                  }
                >
                  {newPasswordError || PASSWORD_HINT}
                </AuthText>
              </div>

              <div className="flex flex-col gap-2">
                <AuthText size="md">새 비밀번호 확인</AuthText>
                <PasswordInput
                  label="새 비밀번호 확인"
                  autoComplete="new-password"
                  placeholder="비밀번호 확인"
                  value={newPasswordCheck}
                  state={newPasswordCheckError ? "error" : "default"}
                  onChange={handleChangeCheck}
                />
                <AuthText
                  size="sm"
                  className={
                    newPasswordCheckError ? "text-negative!" : "text-gray-400!"
                  }
                >
                  {newPasswordCheckError || PASSWORD_HINT}
                </AuthText>
              </div>
            </div>
          </div>

          <div className="fixed bottom-5 left-1/2 flex w-80 -translate-x-1/2 flex-col gap-3 tablet:static tablet:left-auto tablet:w-full tablet:translate-x-0">
            {submitError && (
              <AuthText size="sm" role="alert" className="text-negative!">
                {submitError}
              </AuthText>
            )}
            <div className="h-12">
              <AuthButton
                color="light"
                onClick={handleDelay}
                disabled={isDelaying}
              >
                <AuthText as="span" size="md" className="text-inherit!">
                  다음에 변경하기
                </AuthText>
              </AuthButton>
            </div>
            <div className="h-12">
              <AuthButton
                color="primary"
                onClick={handleSubmit}
                disabled={!canSubmit || isChanging}
              >
                <AuthText as="span" size="md" className="text-inherit!">
                  변경하기
                </AuthText>
              </AuthButton>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
