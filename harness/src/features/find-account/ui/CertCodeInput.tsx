import { useState } from "react";

import chevronRight from "@/shared/assets/img/system/chevron-right.svg";
import { AuthButton, AuthInput, AuthText } from "@/shared/components/auth";
import { useTranslation } from "@/shared/i18n";
import { cn } from "@/shared/lib";

import type { CertMessage } from "../model/use-cert-flow";

interface CertCodeInputProps {
  countdownText: string;
  message: CertMessage | null;
  onClickConfirm: (code: string) => void;
  onClickResend: () => void;
  className?: string;
}

/**
 * 문구는 두 줄일 수 있음. 둘째 줄(남은 횟수)은 재발송 버튼과 같은 행에 놓여야 해서
 * `\n`으로 나눠 따로 그림.
 */
export function CertCodeInput({
  countdownText,
  message,
  onClickConfirm,
  onClickResend,
  className,
}: CertCodeInputProps) {
  const { t } = useTranslation("features/find-account");
  const [code, setCode] = useState("");

  const text = message
    ? t(`message.${message.content.code}`, message.content.values)
    : undefined;
  const newlineIndex = text?.indexOf("\n") ?? -1;
  const leadLine = newlineIndex >= 0 ? text?.slice(0, newlineIndex) : text;
  const tailLine =
    newlineIndex >= 0 ? text?.slice(newlineIndex + 1) : undefined;
  // 톤이 없으면 부정 안내로 봄.
  const tone = message?.tone ?? "negative";

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <div className="flex items-center gap-2">
        <div className="relative h-11 flex-1">
          <AuthInput
            aria-label={t("codeLabel")}
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
        <div className="h-11 w-[120px] shrink-0">
          <AuthButton
            color="primary"
            disabled={!code}
            onClick={() => onClickConfirm(code)}
          >
            <AuthText as="span" size="md" tone="inherit">
              {t("confirmCode")}
            </AuthText>
          </AuthButton>
        </div>
      </div>

      <div className="flex flex-col">
        {leadLine && (
          <AuthText size="sm" tone={tone} role="status">
            {leadLine}
          </AuthText>
        )}
        <div className="flex items-end justify-between gap-2">
          <div className="min-w-0 flex-1">
            {tailLine && (
              <AuthText size="sm" tone={tone}>
                {tailLine}
              </AuthText>
            )}
          </div>
          <button
            type="button"
            onClick={onClickResend}
            className="flex shrink-0 items-center gap-2"
          >
            <AuthText as="span" size="sm" tone="faint">
              {t("resendRequest")}
            </AuthText>
            <img src={chevronRight} alt="" className="size-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
