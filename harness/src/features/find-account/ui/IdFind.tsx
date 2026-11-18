import { useState } from "react";

import { AuthButton, AuthInput, AuthText } from "@/shared/components/auth";
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
      <div className={cn("flex flex-col gap-4", className)}>
        <AuthText size="md">{t("foundId", { id: foundId })}</AuthText>
        <div className="h-12">
          <AuthButton color="primary" onClick={onClickGoLogin}>
            <AuthText as="span" size="md" tone="inherit">
              {tCommon("action.login")}
            </AuthText>
          </AuthButton>
        </div>
        <div className="h-12">
          <AuthButton color="light" onClick={onClickGoFindPassword}>
            <AuthText as="span" size="md" tone="inherit">
              {tCommon("link.findPassword")}
            </AuthText>
          </AuthButton>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("flex min-h-0 flex-1 flex-col", className)}>
      <div className="flex min-h-0 flex-1 flex-col gap-12 overflow-y-auto tablet:flex-none">
        <div className="flex flex-col gap-5">
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
                flow.isEmailMethod ? t("email") : t("phoneIdPlaceholder")
              }
              onChangeValue={flow.changeContact}
              onClickSend={handleSendCode}
              isSendDisabled={isSendDisabled}
              // 인증번호 입력란이 보이면 문구는 그쪽에서 그림.
              message={flow.isCertSent ? null : flow.message}
            />
          )}

          {flow.isCertSent && (
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
            isDisabled={!name}
            onClickSelect={flow.selectMethod}
          />
        )}
      </div>

      <CertPopups flow={flow} />
    </div>
  );
}
