import { tryit } from "radash";
import { useState } from "react";
import { useNavigate } from "react-router";

import { clearLoginCredential, readLoginCredential } from "@/entities/session";
import { isApiError } from "@/shared/api";
import {
  AuthButton,
  AuthHeader,
  AuthText,
  PasswordInput,
} from "@/shared/components/auth";
import { ROUTES } from "@/shared/config";
import { Trans, useTranslation } from "@/shared/i18n";
import { cn } from "@/shared/lib";

import { useChangeExpiredPassword } from "../api/use-change-expired-password";
import { useDelayExpiredPassword } from "../api/use-delay-expired-password";
import {
  mapExpiredError,
  readExpiredErrorReason,
} from "../lib/map-expired-error";
import { usePasswordFields } from "../model/use-password-fields";
import { useRelogin } from "../model/use-relogin";
import { ExpiredPasswordDone } from "./ExpiredPasswordDone";

import type { ExpiredSubmitErrorCode } from "../model/schema";

interface ExpiredPasswordFormProps {
  className?: string;
}

/**
 * 비밀번호를 바꾼 지 6개월이 지난 계정에 보여 주는 화면. 로그인 페이지가
 * 라우터 state가 아닌 메모리에 담아 둔 아이디와 비밀번호를 들고 이곳으로 보냄
 * (`@/entities/session`의 `login-handoff` 참고).
 */
export function ExpiredPasswordForm({ className }: ExpiredPasswordFormProps) {
  const { t } = useTranslation("features/expired-password");
  const { id, password } = readLoginCredential() ?? {};
  const navigate = useNavigate();
  const relogin = useRelogin();
  const { trigger: changeExpired, isMutating: isChanging } =
    useChangeExpiredPassword();
  const { trigger: delayExpired, isMutating: isDelaying } =
    useDelayExpiredPassword();
  const fields = usePasswordFields(password);

  const [submitError, setSubmitError] = useState<ExpiredSubmitErrorCode | null>(
    null,
  );
  const [isSuccess, setIsSuccess] = useState(false);

  function goToLogin() {
    void navigate(ROUTES.login);
  }

  async function handleSubmit() {
    if (!id) {
      goToLogin();
      return;
    }
    if (!fields.canSubmit) {
      setSubmitError("submitRequired");
      return;
    }
    setSubmitError(null);
    const [error, data] = await tryit(changeExpired)({
      id,
      originPW: fields.originPassword,
      newPW: fields.newPassword,
      newPWCheck: fields.newPasswordCheck,
    });
    if (error) {
      const reason = isApiError(error)
        ? readExpiredErrorReason(error.data)
        : undefined;
      setSubmitError(mapExpiredError(reason));
      return;
    }
    if (!data?.result) {
      setSubmitError("unknown");
      return;
    }
    clearLoginCredential();
    setIsSuccess(true);
  }

  async function handleDelay() {
    if (!id) {
      goToLogin();
      return;
    }
    const [error] = await tryit(delayExpired)(id);
    if (error) {
      setSubmitError("delay");
      return;
    }
    await relogin(id, password);
  }

  if (isSuccess) {
    return (
      <ExpiredPasswordDone className={className} onClickLogin={goToLogin} />
    );
  }

  return (
    <main
      className={cn(
        "flex min-h-dvh flex-col items-center gap-5 bg-background",
        className,
      )}
    >
      <AuthHeader title={t("header")} onClickBack={goToLogin} />

      <div className="flex w-80 flex-1 flex-col pb-40 tablet:w-96 tablet:pb-0">
        <div className="flex flex-1 flex-col tablet:flex-none tablet:gap-12">
          <div className="flex flex-col gap-5 tablet:gap-12">
            <AuthText size="md">
              <Trans t={t} i18nKey="intro" components={{ br: <br /> }} />
            </AuthText>

            <div className="flex flex-col gap-5">
              <div className="flex flex-col gap-2">
                <AuthText size="md">{t("current.label")}</AuthText>
                <PasswordInput
                  label={t("current.label")}
                  autoComplete="current-password"
                  placeholder={t("current.placeholder")}
                  value={fields.originPassword}
                  state={fields.isOriginWrong ? "error" : "default"}
                  onChange={fields.onChangeOrigin}
                />
                {fields.isOriginWrong && (
                  <AuthText size="sm" role="alert" tone="negative">
                    {t("current.wrong")}
                  </AuthText>
                )}
              </div>

              <div className="flex flex-col gap-2">
                <AuthText size="md">{t("new.label")}</AuthText>
                <PasswordInput
                  label={t("new.label")}
                  autoComplete="new-password"
                  placeholder={t("new.placeholder")}
                  value={fields.newPassword}
                  state={fields.hasNewPasswordError ? "error" : "default"}
                  onChange={fields.onChangeNew}
                />
                <AuthText
                  size="sm"
                  tone={fields.hasNewPasswordError ? "negative" : "faint"}
                >
                  {fields.hasNewPasswordError ? t("formatError") : t("hint")}
                </AuthText>
              </div>

              <div className="flex flex-col gap-2">
                <AuthText size="md">{t("check.label")}</AuthText>
                <PasswordInput
                  label={t("check.label")}
                  autoComplete="new-password"
                  placeholder={t("check.placeholder")}
                  value={fields.newPasswordCheck}
                  state={fields.isCheckMismatch ? "error" : "default"}
                  onChange={fields.onChangeCheck}
                />
                <AuthText
                  size="sm"
                  tone={fields.isCheckMismatch ? "negative" : "faint"}
                >
                  {fields.isCheckMismatch ? t("mismatch") : t("hint")}
                </AuthText>
              </div>
            </div>
          </div>

          <div className="fixed bottom-5 left-1/2 flex w-80 -translate-x-1/2 flex-col gap-3 tablet:static tablet:left-auto tablet:w-full tablet:translate-x-0">
            {submitError && (
              <AuthText size="sm" role="alert" tone="negative">
                {t(`submitError.${submitError}`)}
              </AuthText>
            )}
            <div className="h-12">
              <AuthButton
                color="light"
                onClick={handleDelay}
                disabled={isDelaying}
              >
                <AuthText as="span" size="md" tone="inherit">
                  {t("delay")}
                </AuthText>
              </AuthButton>
            </div>
            <div className="h-12">
              <AuthButton
                color="primary"
                onClick={handleSubmit}
                disabled={!fields.canSubmit || isChanging}
              >
                <AuthText as="span" size="md" tone="inherit">
                  {t("submit")}
                </AuthText>
              </AuthButton>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
