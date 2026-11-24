import { useState } from "react";
import { useNavigate } from "react-router";

import {
  AuthButton,
  AuthInput,
  AuthText,
  AuthTextButton,
} from "@/shared/components/auth";
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
          <AuthText as="span" size="fixed-base" tone="inherit">
            {t("changePassword")}
          </AuthText>
        </AuthButton>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-1 flex-col", className)}>
      <div className="flex flex-col gap-5 tablet:flex-none">
        <AuthInput
          aria-label={t("pwId")}
          autoComplete="username"
          placeholder={t("pwId")}
          value={id}
          onChange={(event) => setId(event.target.value)}
        />
        <AuthInput
          aria-label={t("name")}
          autoComplete="name"
          placeholder={t("name")}
          value={name}
          onChange={(event) => setName(event.target.value)}
        />

        {flow.method && (
          <div className="flex flex-col gap-3">
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

            {flow.method === "phone" && flow.isCertSent && (
              <CertCodeInput
                countdownText={flow.countdown.text}
                onClickConfirm={handleVerifyCode}
                onClickResend={handleSendCode}
                message={flow.message}
              />
            )}
          </div>
        )}
      </div>

      <div className="mt-auto flex flex-col py-5 tablet:mt-12 tablet:p-0">
        {flow.method ? (
          <AuthTextButton onClick={flow.reset} className="self-center">
            {t("startOver")}
          </AuthTextButton>
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
