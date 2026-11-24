import { useState } from "react";

import {
  AuthButton,
  AuthInput,
  AuthText,
  AuthTextButton,
} from "@/shared/components/auth";
import { useTranslation } from "@/shared/i18n";
import { cn } from "@/shared/lib";

import { useCertFlow } from "../model/use-cert-flow";
import { useIdLookup } from "../model/use-id-lookup";
import { CertCodeInput } from "./CertCodeInput";
import { CertContactField } from "./CertContactField";
import { CertMethodChooser } from "./CertMethodChooser";
import { CertPopups } from "./CertPopups";

interface IdFindProps {
  onClickGoLogin: () => void;
  onClickGoFindPassword: () => void;
  className?: string;
}

export function IdFind({
  onClickGoLogin,
  onClickGoFindPassword,
  className,
}: IdFindProps) {
  const { t } = useTranslation("features/find-account");
  const { t: tCommon } = useTranslation();
  const flow = useCertFlow();
  const [name, setName] = useState("");
  const { foundId, handleSendCode, handleVerifyCode } = useIdLookup(flow, name);

  const isSendDisabled = !name || !flow.contact || flow.isSending;

  if (foundId) {
    return (
      <div className={cn("flex flex-1 flex-col", className)}>
        {/* 모바일은 남는 높이의 가운데, 태블릿 이상은 탭 바로 아래에 놓임. */}
        <div className="flex flex-1 flex-col items-center justify-center gap-2.5 text-center tablet:flex-none tablet:justify-start">
          <AuthText size="md">{t("foundIdIntro", { name })}</AuthText>
          <AuthText size="md" weight="bold">
            {t("foundId", { id: foundId })}
          </AuthText>
        </div>
        <div className="flex flex-col gap-3 py-5 tablet:mt-12 tablet:p-0">
          <div className="h-12">
            <AuthButton color="primary" onClick={onClickGoLogin}>
              <AuthText as="span" size="fixed-base" tone="inherit">
                {t("goLogin")}
              </AuthText>
            </AuthButton>
          </div>
          <div className="h-12">
            <AuthButton color="light" onClick={onClickGoFindPassword}>
              <AuthText as="span" size="fixed-base" tone="inherit">
                {tCommon("link.findPassword")}
              </AuthText>
            </AuthButton>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-1 flex-col", className)}>
      <div className="flex flex-col gap-5 tablet:flex-none">
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
                flow.isEmailMethod ? t("email") : t("phoneIdPlaceholder")
              }
              onChangeValue={flow.changeContact}
              onClickSend={handleSendCode}
              isSendDisabled={isSendDisabled}
              // 인증번호 입력란이 보이면 문구는 그쪽에서 그림.
              message={flow.isCertSent ? null : flow.message}
            />

            {flow.isCertSent && (
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
            isDisabled={!name}
            onClickSelect={flow.selectMethod}
          />
        )}
      </div>

      <CertPopups flow={flow} />
    </div>
  );
}
