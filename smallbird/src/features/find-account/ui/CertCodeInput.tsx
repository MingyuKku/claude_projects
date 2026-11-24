import { useId, useState } from "react";

import chevronRight from "@/shared/assets/img/system/chevron-right.svg";
import {
  AuthButton,
  AuthInput,
  AuthSupportText,
  AuthText,
  AuthTextButton,
} from "@/shared/components/auth";
import { useTranslation } from "@/shared/i18n";
import { cn } from "@/shared/lib";

import { toSupportState } from "../lib/support-state";

import type { CertMessage } from "../model/use-cert-flow";

interface CertCodeInputProps {
  countdownText: string;
  message: CertMessage | null;
  onClickConfirm: (code: string) => void;
  onClickResend: () => void;
  className?: string;
}

/**
 * 문구는 두 줄일 수 있음(둘째 줄이 남은 횟수). `\n`을 줄바꿈으로 그대로 보여 주고,
 * 태블릿 이상은 문구 옆에, 모바일은 문구 아래 오른쪽에 재전송 버튼을 둠.
 */
export function CertCodeInput({
  countdownText,
  message,
  onClickConfirm,
  onClickResend,
  className,
}: CertCodeInputProps) {
  const { t } = useTranslation("features/find-account");
  const messageId = useId();
  const [code, setCode] = useState("");

  const text = message
    ? t(`message.${message.content.code}`, message.content.values)
    : undefined;

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <div className="flex items-center gap-2.5">
        <div className="relative h-11 min-w-0 flex-1">
          <AuthInput
            aria-label={t("codeLabel")}
            aria-describedby={text ? messageId : undefined}
            placeholder={t("codePlaceholder")}
            value={code}
            className="pr-14"
            state={message?.tone === "negative" ? "error" : "default"}
            onChange={(event) => setCode(event.target.value)}
          />
          <AuthText
            as="span"
            size="sm"
            tone="negative"
            className="absolute top-1/2 right-3 -translate-y-1/2"
          >
            {countdownText}
          </AuthText>
        </div>
        <div className="h-11 w-28.25 shrink-0">
          <AuthButton
            color="primary"
            disabled={!code}
            onClick={() => onClickConfirm(code)}
          >
            <AuthText as="span" size="sm" tone="inherit">
              {t("confirmCode")}
            </AuthText>
          </AuthButton>
        </div>
      </div>

      <div className="flex flex-col gap-2 tablet:flex-row tablet:items-start tablet:justify-between">
        {message && text && (
          <AuthSupportText
            id={messageId}
            role="status"
            state={toSupportState(message.tone)}
            className="min-w-0 whitespace-pre-line"
          >
            {text}
          </AuthSupportText>
        )}
        <AuthTextButton
          variant="plain"
          className="ml-auto shrink-0 gap-2"
          onClick={onClickResend}
        >
          {t("resendRequest")}
          <img src={chevronRight} alt="" className="size-4" />
        </AuthTextButton>
      </div>
    </div>
  );
}
