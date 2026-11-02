import { tryit } from "radash";
import { useState } from "react";

import { getPasswordError } from "@/entities/account";
import { isApiError } from "@/shared/api";
import checkCircle from "@/shared/assets/img/system/check-circle.svg";
import chevronRight from "@/shared/assets/img/system/chevron-right.svg";
import { AuthButton, AuthText, PasswordInput } from "@/shared/components/auth";
import { Trans, useTranslation } from "@/shared/i18n";
import { cn } from "@/shared/lib";

import { useChangePassword } from "../api/use-change-password";
import {
  mapChangeError,
  readChangeErrorMessage,
} from "../lib/map-change-error";
import {
  CHANGE_PASSWORD_SUCCESS_RESULT,
  PASSWORD_MAX_LENGTH,
} from "../model/constants";

import type { ChangeSubmitErrorCode } from "../model/schema";
import type { PasswordErrorCode } from "@/entities/account";
import type { ChangeEvent } from "react";

interface ChangePasswordFormProps {
  className?: string;
  onClickLogin: () => void;
}

export function ChangePasswordForm({
  className,
  onClickLogin,
}: ChangePasswordFormProps) {
  const { t } = useTranslation("features/change-password");
  const { t: tCommon } = useTranslation();
  const { trigger, isMutating } = useChangePassword();

  const [password, setPassword] = useState("");
  const [passwordCheck, setPasswordCheck] = useState("");
  const [passwordError, setPasswordError] = useState<PasswordErrorCode | null>(
    null,
  );
  const [isCheckMismatch, setIsCheckMismatch] = useState(false);
  const [submitError, setSubmitError] = useState<ChangeSubmitErrorCode | null>(
    null,
  );
  const [isSuccess, setIsSuccess] = useState(false);

  const canSubmit = Boolean(
    password && passwordCheck && !passwordError && !isCheckMismatch,
  );

  function handleChangePassword(event: ChangeEvent<HTMLInputElement>) {
    const value = event.target.value;
    setPassword(value);
    // 이 화면은 아이디를 몰라서 "아이디 포함" 검사는 서버가 함.
    setPasswordError(value ? getPasswordError(value, "") : null);
    if (passwordCheck) {
      setIsCheckMismatch(value !== passwordCheck);
    }
  }

  function handleChangePasswordCheck(event: ChangeEvent<HTMLInputElement>) {
    const value = event.target.value;
    setPasswordCheck(value);
    setIsCheckMismatch(Boolean(value) && value !== password);
  }

  async function handleClickSubmit() {
    if (!canSubmit) {
      setSubmitError("submitRequired");
      return;
    }
    setSubmitError(null);
    const [error, data] = await tryit(trigger)(passwordCheck);
    if (error) {
      const message = isApiError(error)
        ? readChangeErrorMessage(error.data)
        : undefined;
      setSubmitError(mapChangeError(message));
      return;
    }
    if (data?.result === CHANGE_PASSWORD_SUCCESS_RESULT) setIsSuccess(true);
  }

  return (
    <div className={cn("flex flex-1 flex-col", className)}>
      <div className="flex w-80 flex-1 flex-col pt-5 tablet:w-96">
        <div className="flex flex-1 flex-col tablet:flex-none tablet:gap-12">
          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-2.5">
              <AuthText size="md" isRequired>
                {tCommon("field.password")}
              </AuthText>
              <div className="flex flex-col gap-2">
                <PasswordInput
                  label={tCommon("field.password")}
                  placeholder={t("placeholder")}
                  maxLength={PASSWORD_MAX_LENGTH}
                  value={password}
                  state={passwordError ? "error" : "default"}
                  onChange={handleChangePassword}
                />
                <AuthText size="sm" tone={passwordError ? "negative" : "faint"}>
                  {passwordError
                    ? t(`passwordError.${passwordError}`)
                    : t("hint")}
                </AuthText>
              </div>
            </div>

            <div className="flex flex-col gap-2.5">
              <AuthText size="md" isRequired>
                {t("checkLabel")}
              </AuthText>
              <div className="flex flex-col gap-2">
                <PasswordInput
                  label={t("checkLabel")}
                  placeholder={t("checkPlaceholder")}
                  maxLength={PASSWORD_MAX_LENGTH}
                  value={passwordCheck}
                  state={isCheckMismatch ? "error" : "default"}
                  onChange={handleChangePasswordCheck}
                />
                <AuthText
                  size="sm"
                  tone={isCheckMismatch ? "negative" : "faint"}
                >
                  {isCheckMismatch ? t("mismatch") : t("hint")}
                </AuthText>
              </div>
            </div>
          </div>

          <div className="mt-auto flex flex-col gap-5 tablet:mt-0">
            {submitError && (
              <AuthText size="sm" role="alert" tone="negative">
                {t(`submitError.${submitError}`)}
              </AuthText>
            )}
            <div className="mb-5 h-12 tablet:mb-0">
              <AuthButton
                color="primary"
                onClick={handleClickSubmit}
                disabled={!canSubmit || isMutating}
              >
                <AuthText as="span" size="md" tone="inherit">
                  {t("submit")}
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
            className="flex w-[300px] flex-col items-center gap-6 rounded-auth-xl bg-light p-5 shadow-normal tablet:w-80"
          >
            <div className="flex flex-col items-center gap-3 text-center">
              <img src={checkCircle} alt="" className="size-11" />
              <AuthText id="change-password-done" size="xl" weight="bold">
                {t("done.title")}
              </AuthText>
              <AuthText size="md">
                <Trans
                  t={t}
                  i18nKey="done.message"
                  components={{ br: <br /> }}
                />
              </AuthText>
              <AuthText size="sm" tone="faint">
                <Trans
                  t={t}
                  i18nKey="done.notice"
                  components={{ br: <br /> }}
                />
              </AuthText>
            </div>
            <div className="h-12 w-full">
              <AuthButton color="primary" onClick={onClickLogin}>
                <div className="flex items-center gap-2">
                  <AuthText as="span" size="md" tone="inherit">
                    {t("done.login")}
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
