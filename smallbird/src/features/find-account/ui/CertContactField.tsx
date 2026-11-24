import { useId } from "react";

import {
  AuthButton,
  AuthInput,
  AuthSupportText,
  AuthText,
} from "@/shared/components/auth";
import { useTranslation } from "@/shared/i18n";
import { cn } from "@/shared/lib";

import { toSupportState } from "../lib/support-state";

import type { CertMessage, CertMethod } from "../model/use-cert-flow";
import type { KeyboardEvent } from "react";

interface CertContactFieldProps {
  method: CertMethod;
  value: string;
  placeholder: string;
  isSendDisabled: boolean;
  /** 인증번호 입력란이 나타나기 전까지만 여기에 보임. */
  message: CertMessage | null;
  onChangeValue: (value: string) => void;
  onClickSend: () => void;
  className?: string;
}

export function CertContactField({
  method,
  value,
  placeholder,
  isSendDisabled,
  message,
  onChangeValue,
  onClickSend,
  className,
}: CertContactFieldProps) {
  const { t } = useTranslation("features/find-account");
  const messageId = useId();

  const isEmail = method === "email";

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    // 한글 IME 조합을 확정하는 Enter가 발송으로 이어지면 안 됨.
    if (event.nativeEvent.isComposing) return;
    if (event.key === "Enter" && !isSendDisabled) onClickSend();
  }

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <div className="flex flex-col gap-2.5">
        <AuthText size="md" isRequired>
          {t("request")}
        </AuthText>
        <div className="flex items-center gap-2.5">
          <div className="h-11 min-w-0 flex-1">
            <AuthInput
              type={isEmail ? "email" : "tel"}
              inputMode={isEmail ? "email" : "numeric"}
              autoComplete={isEmail ? "email" : "tel"}
              aria-label={isEmail ? t("email") : t("phoneAria")}
              aria-describedby={message ? messageId : undefined}
              state={message?.tone === "negative" ? "error" : "default"}
              placeholder={placeholder}
              value={value}
              onChange={(event) => onChangeValue(event.target.value)}
              onKeyDown={handleKeyDown}
            />
          </div>
          <div className="h-11 w-28.25 shrink-0">
            <AuthButton
              color="primary"
              disabled={isSendDisabled}
              onClick={onClickSend}
            >
              <AuthText as="span" size="sm" tone="inherit">
                {t("send")}
              </AuthText>
            </AuthButton>
          </div>
        </div>
      </div>
      {message && (
        <AuthSupportText
          id={messageId}
          role="status"
          state={toSupportState(message.tone)}
        >
          {t(`message.${message.content.code}`, message.content.values)}
        </AuthSupportText>
      )}
    </div>
  );
}
