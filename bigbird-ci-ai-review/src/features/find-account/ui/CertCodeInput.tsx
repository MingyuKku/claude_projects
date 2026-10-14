import { useState } from "react";

import chevronRight from "@/shared/assets/img/system/chevron-right.svg";
import { AuthButton, AuthInput, AuthText } from "@/shared/components/auth";
import { cn } from "@/shared/lib";

import type { CertMessage } from "../model/use-cert-flow";

interface Props {
  countdownText: string;
  message: CertMessage | null;
  onClickConfirm: (code: string) => void;
  onClickResend: () => void;
  className?: string;
}

/**
 * The message can span two lines: the second one (remaining tries) has to sit on
 * the same row as the resend button, so it is split on `\n` and drawn separately.
 */
export function CertCodeInput({
  countdownText,
  message,
  onClickConfirm,
  onClickResend,
  className,
}: Props) {
  const [code, setCode] = useState("");

  const newlineIndex = message?.text.indexOf("\n") ?? -1;
  const leadLine =
    newlineIndex >= 0 ? message?.text.slice(0, newlineIndex) : message?.text;
  const tailLine =
    newlineIndex >= 0 ? message?.text.slice(newlineIndex + 1) : undefined;
  const toneClass =
    message?.tone === "positive" ? "text-positive!" : "text-negative!";

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <div className="flex items-center gap-2">
        <div className="relative h-11 flex-1">
          <AuthInput
            aria-label="인증번호"
            placeholder="인증번호 입력"
            value={code}
            className="pr-14"
            state={message?.tone === "negative" ? "error" : "default"}
            onChange={(event) => setCode(event.target.value)}
          />
          <AuthText
            as="span"
            size="sm"
            className="absolute top-1/2 right-3 -translate-y-1/2 text-negative!"
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
            <AuthText as="span" size="md" className="text-inherit!">
              인증하기
            </AuthText>
          </AuthButton>
        </div>
      </div>

      <div className="flex flex-col">
        {leadLine && (
          <AuthText size="sm" className={toneClass} role="status">
            {leadLine}
          </AuthText>
        )}
        <div className="flex items-end justify-between gap-2">
          <div className="min-w-0 flex-1">
            {tailLine && (
              <AuthText size="sm" className={toneClass}>
                {tailLine}
              </AuthText>
            )}
          </div>
          <button
            type="button"
            onClick={onClickResend}
            className="flex shrink-0 items-center gap-2"
          >
            <AuthText as="span" size="sm" className="text-gray-400!">
              인증번호 재전송 요청
            </AuthText>
            <img src={chevronRight} alt="" className="size-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
