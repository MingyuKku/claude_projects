import { tryit } from "radash";
import { useId, useState } from "react";
import { useNavigate } from "react-router";

import { clearLoginCredential, readLoginCredential } from "@/entities/session";
import { isApiError } from "@/shared/api";
import {
  AuthButton,
  AuthHeader,
  AuthSupportText,
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
  const originMessageId = useId();
  const newMessageId = useId();
  const checkMessageId = useId();

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
        "flex min-h-dvh flex-col items-center bg-background tablet:gap-12",
        className,
      )}
    >
      <AuthHeader title={t("header")} onClickBack={goToLogin} isBorderHidden />

      <div className="flex w-80 flex-1 flex-col pb-40 tablet:w-96 tablet:pb-17.5 desktop:pb-30">
        <div className="flex flex-1 flex-col tablet:flex-none tablet:gap-12">
          <div className="flex flex-col gap-5 tablet:gap-12">
            <AuthText size="md">
              <Trans t={t} i18nKey="intro" components={{ br: <br /> }} />
            </AuthText>

            <div className="flex flex-col gap-5">
              <div className="flex flex-col gap-2">
                <div className="flex flex-col gap-2.5">
                  <AuthText size="md">{t("current.label")}</AuthText>
                  <PasswordInput
                    label={t("current.label")}
                    aria-describedby={
                      fields.isOriginWrong ? originMessageId : undefined
                    }
                    autoComplete="current-password"
                    placeholder={t("current.placeholder")}
                    value={fields.originPassword}
                    state={fields.isOriginWrong ? "error" : "default"}
                    onChange={fields.onChangeOrigin}
                  />
                </div>
                {fields.isOriginWrong && (
                  <AuthSupportText
                    id={originMessageId}
                    role="alert"
                    state="error"
                  >
                    {t("current.wrong")}
                  </AuthSupportText>
                )}
              </div>

              <div className="flex flex-col gap-2">
                <div className="flex flex-col gap-2.5">
                  <AuthText size="md">{t("new.label")}</AuthText>
                  <PasswordInput
                    label={t("new.label")}
                    aria-describedby={newMessageId}
                    autoComplete="new-password"
                    placeholder={t("new.placeholder")}
                    value={fields.newPassword}
                    state={fields.hasNewPasswordError ? "error" : "default"}
                    onChange={fields.onChangeNew}
                  />
                </div>
                <AuthSupportText
                  id={newMessageId}
                  state={fields.hasNewPasswordError ? "error" : "default"}
                >
                  {fields.hasNewPasswordError ? t("formatError") : t("hint")}
                </AuthSupportText>
              </div>

              <div className="flex flex-col gap-2">
                <div className="flex flex-col gap-2.5">
                  <AuthText size="md">{t("check.label")}</AuthText>
                  <PasswordInput
                    label={t("check.label")}
                    aria-describedby={checkMessageId}
                    autoComplete="new-password"
                    placeholder={t("check.placeholder")}
                    value={fields.newPasswordCheck}
                    state={fields.isCheckMismatch ? "error" : "default"}
                    onChange={fields.onChangeCheck}
                  />
                </div>
                <AuthSupportText
                  id={checkMessageId}
                  state={fields.isCheckMismatch ? "error" : "default"}
                >
                  {fields.isCheckMismatch ? t("mismatch") : t("hint")}
                </AuthSupportText>
              </div>
            </div>
          </div>

          <div className="fixed bottom-5 left-1/2 flex w-80 -translate-x-1/2 flex-col gap-3 tablet:static tablet:left-auto tablet:w-full tablet:translate-x-0">
            {submitError && (
              <AuthSupportText state="error" role="alert">
                {t(`submitError.${submitError}`)}
              </AuthSupportText>
            )}
            <div className="h-12">
              <AuthButton
                color="light"
                onClick={handleDelay}
                disabled={isDelaying}
              >
                <AuthText as="span" size="fixed-base" tone="inherit">
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
                <AuthText as="span" size="fixed-base" tone="inherit">
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
