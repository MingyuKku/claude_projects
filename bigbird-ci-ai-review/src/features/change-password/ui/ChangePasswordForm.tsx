import { tryit } from "radash";
import { useState } from "react";

import {
  PASSWORD_HINT,
  PASSWORD_MISMATCH_MESSAGE,
  validatePassword,
} from "@/entities/account";
import { isApiError } from "@/shared/api";
import checkCircle from "@/shared/assets/img/system/check-circle.svg";
import chevronRight from "@/shared/assets/img/system/chevron-right.svg";
import { AuthButton, AuthText, PasswordInput } from "@/shared/components/auth";
import { cn } from "@/shared/lib";

import { useChangePassword } from "../api/use-change-password";
import {
  mapChangeError,
  readChangeErrorMessage,
} from "../lib/map-change-error";
import {
  CHANGE_PASSWORD_SUCCESS_RESULT,
  PASSWORD_MAX_LENGTH,
  SUBMIT_REQUIRED_MESSAGE,
} from "../model/constants";

import type { ChangeEvent } from "react";

interface Props {
  className?: string;
  onClickLogin: () => void;
}

export function ChangePasswordForm({ className, onClickLogin }: Props) {
  const { trigger, isMutating } = useChangePassword();

  const [password, setPassword] = useState("");
  const [passwordCheck, setPasswordCheck] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordCheckError, setPasswordCheckError] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  const handleChangePassword = (event: ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setPassword(value);
    // This screen does not know the id, so the "contains id" check is the server's.
    setPasswordError(value ? validatePassword(value, "") : null);
    if (passwordCheck) {
      setPasswordCheckError(
        value === passwordCheck ? "" : PASSWORD_MISMATCH_MESSAGE,
      );
    }
  };

  const handleChangePasswordCheck = (event: ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setPasswordCheck(value);
    setPasswordCheckError(
      value && value !== password ? PASSWORD_MISMATCH_MESSAGE : "",
    );
  };

  const canSubmit = Boolean(
    password && passwordCheck && !passwordError && !passwordCheckError,
  );

  const handleSubmit = async () => {
    if (!canSubmit) {
      setSubmitError(SUBMIT_REQUIRED_MESSAGE);
      return;
    }
    setSubmitError("");
    const [error, data] = await tryit(trigger)(passwordCheck);
    if (error) {
      const message = isApiError(error)
        ? readChangeErrorMessage(error.data)
        : undefined;
      setSubmitError(mapChangeError(message));
      return;
    }
    if (data?.result === CHANGE_PASSWORD_SUCCESS_RESULT) setIsSuccess(true);
  };

  return (
    <div className={cn("flex flex-1 flex-col", className)}>
      <div className="flex w-80 flex-1 flex-col pt-5 tablet:w-96">
        <div className="flex flex-1 flex-col tablet:flex-none tablet:gap-12">
          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-2.5">
              <AuthText size="md" required>
                비밀번호
              </AuthText>
              <div className="flex flex-col gap-2">
                <PasswordInput
                  label="비밀번호"
                  placeholder="영문, 숫자 포함 8자리 이상"
                  maxLength={PASSWORD_MAX_LENGTH}
                  value={password}
                  state={passwordError ? "error" : "default"}
                  onChange={handleChangePassword}
                />
                <AuthText
                  size="sm"
                  className={
                    passwordError ? "text-negative!" : "text-gray-400!"
                  }
                >
                  {passwordError || PASSWORD_HINT}
                </AuthText>
              </div>
            </div>

            <div className="flex flex-col gap-2.5">
              <AuthText size="md" required>
                비밀번호 확인
              </AuthText>
              <div className="flex flex-col gap-2">
                <PasswordInput
                  label="비밀번호 확인"
                  placeholder="비밀번호 확인"
                  maxLength={PASSWORD_MAX_LENGTH}
                  value={passwordCheck}
                  state={passwordCheckError ? "error" : "default"}
                  onChange={handleChangePasswordCheck}
                />
                <AuthText
                  size="sm"
                  className={
                    passwordCheckError ? "text-negative!" : "text-gray-400!"
                  }
                >
                  {passwordCheckError || PASSWORD_HINT}
                </AuthText>
              </div>
            </div>
          </div>

          <div className="mt-auto flex flex-col gap-5 tablet:mt-0">
            {submitError && (
              <AuthText size="sm" role="alert" className="text-negative!">
                {submitError}
              </AuthText>
            )}
            <div className="mb-5 h-12 tablet:mb-0">
              <AuthButton
                color="primary"
                onClick={handleSubmit}
                disabled={!canSubmit || isMutating}
              >
                <AuthText as="span" size="md" className="text-inherit!">
                  변경하기
                </AuthText>
              </AuthButton>
            </div>
          </div>
        </div>
      </div>

      {isSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-dark/60">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="change-password-done"
            className="flex w-[300px] flex-col items-center gap-6 rounded-xl bg-light p-5 shadow-normal tablet:w-80"
          >
            <div className="flex flex-col items-center gap-3 text-center">
              <img src={checkCircle} alt="" className="size-11" />
              <AuthText id="change-password-done" size="xl" weight="bold">
                비밀번호 변경 완료
              </AuthText>
              <AuthText size="md">
                비밀번호가 정상적으로 변경되었습니다.
                <br />
                새로운 비밀번호로 로그인해 주세요.
              </AuthText>
              <AuthText size="sm" className="text-gray-400!">
                ※ 보안을 위해 다른 기기에서 로그인된 계정은
                <br />
                자동 로그아웃 될 수 있습니다.
              </AuthText>
            </div>
            <div className="h-12 w-full">
              <AuthButton color="primary" onClick={onClickLogin}>
                <div className="flex items-center gap-2">
                  <AuthText as="span" size="md" className="text-inherit!">
                    로그인하러 가기
                  </AuthText>
                  <img src={chevronRight} alt="" className="size-4 invert" />
                </div>
              </AuthButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
