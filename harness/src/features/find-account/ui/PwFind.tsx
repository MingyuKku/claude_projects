import { useState } from "react";
import { useNavigate } from "react-router";

import { AuthButton, AuthInput, AuthText } from "@/shared/components/auth";
import { ROUTES } from "@/shared/config";
import { useTranslation } from "@/shared/i18n";
import { cn } from "@/shared/lib";

import { useCertFlow } from "../model/use-cert-flow";
import { usePwLookup } from "../model/use-pw-lookup";
import { CertCodeInput } from "./CertCodeInput";
import { CertContactField } from "./CertContactField";
import { CertMethodChooser } from "./CertMethodChooser";
import { CertPopups } from "./CertPopups";

interface PwFindProps {
  className?: string;
}

export function PwFind({ className }: PwFindProps) {
  const { t } = useTranslation("features/find-account");
  const navigate = useNavigate();
  const flow = useCertFlow();
  const [id, setId] = useState("");
  const [name, setName] = useState("");
  const { isVerified, handleSendCode, handleVerifyCode } = usePwLookup(
    flow,
    id,
    name,
  );

  const isSendDisabled = !id || !name || !flow.contact || flow.isSending;

  // 쿼리 스트링을 쓰지 않음. URL에 재설정 코드가 있으면 유효한 자격 증명이
  // 히스토리·Referer·프록시 로그에 남음.
  function handleClickChangePassword() {
    void navigate(ROUTES.changePassword);
  }

  if (isVerified) {
    return (
      <div className={cn("h-12", className)}>
        <AuthButton color="primary" onClick={handleClickChangePassword}>
          <AuthText as="span" size="md" tone="inherit">
            {t("changePassword")}
          </AuthText>
        </AuthButton>
      </div>
    );
  }

  return (
    <div className={cn("flex min-h-0 flex-1 flex-col", className)}>
      <div className="flex min-h-0 flex-1 flex-col gap-12 overflow-y-auto tablet:flex-none">
        <div className="flex flex-col gap-5">
          <div className="h-11">
            <AuthInput
              aria-label={t("pwId")}
              autoComplete="username"
              placeholder={t("pwId")}
              value={id}
              onChange={(event) => setId(event.target.value)}
            />
          </div>
          <div className="h-11">
            <AuthInput
              aria-label={t("name")}
              autoComplete="name"
              placeholder={t("name")}
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          </div>

          {flow.method && (
            <CertContactField
              method={flow.method}
              value={flow.contact}
              placeholder={
                flow.isEmailMethod ? t("email") : t("phonePwPlaceholder")
              }
              onChangeValue={flow.changeContact}
              onClickSend={handleSendCode}
              isSendDisabled={isSendDisabled}
              message={flow.isCertSent ? null : flow.message}
            />
          )}

          {flow.method === "phone" && flow.isCertSent && (
            <CertCodeInput
              countdownText={flow.countdown.text}
              onClickConfirm={handleVerifyCode}
              onClickResend={handleSendCode}
              message={flow.message}
            />
          )}
        </div>
      </div>

      <div className="flex shrink-0 flex-col py-5 tablet:mt-12 tablet:p-0">
        {flow.method ? (
          <button
            type="button"
            onClick={flow.reset}
            className="self-center border-b border-gray-300"
          >
            <AuthText as="span" size="sm" tone="faint">
              {t("startOver")}
            </AuthText>
          </button>
        ) : (
          <CertMethodChooser
            isDisabled={!id || !name}
            onClickSelect={flow.selectMethod}
          />
        )}
      </div>

      <CertPopups flow={flow} />
    </div>
  );
}
