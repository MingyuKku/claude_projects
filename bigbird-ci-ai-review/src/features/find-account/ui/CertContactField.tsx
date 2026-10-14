import { AuthButton, AuthInput, AuthText } from "@/shared/components/auth";
import { cn } from "@/shared/lib";

import type { CertMessage, CertMethod } from "../model/use-cert-flow";
import type { KeyboardEvent } from "react";

interface Props {
  method: CertMethod;
  value: string;
  placeholder: string;
  isSendDisabled: boolean;
  /** Shown here only until the code input appears. */
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
}: Props) {
  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    // The Enter that confirms a Korean IME composition must not trigger a send.
    if (event.nativeEvent.isComposing) return;
    if (event.key === "Enter" && !isSendDisabled) onClickSend();
  }

  return (
    <div className={cn("flex flex-col gap-2.5", className)}>
      <AuthText size="md" required>
        인증번호 요청
      </AuthText>
      <div className="flex items-center gap-2">
        <div className="h-11 flex-1">
          <AuthInput
            type={method === "email" ? "email" : "tel"}
            inputMode={method === "email" ? "email" : "numeric"}
            autoComplete={method === "email" ? "email" : "tel"}
            aria-label={method === "email" ? "이메일" : "휴대폰 번호"}
            placeholder={placeholder}
            value={value}
            onChange={(event) => onChangeValue(event.target.value)}
            onKeyDown={handleKeyDown}
          />
        </div>
        <div className="h-11 w-[120px] shrink-0">
          <AuthButton
            color="primary"
            disabled={isSendDisabled}
            onClick={onClickSend}
          >
            <AuthText as="span" size="md" className="text-inherit!">
              인증번호 발송
            </AuthText>
          </AuthButton>
        </div>
      </div>
      {message && (
        <AuthText
          size="sm"
          role="status"
          className={
            message.tone === "positive" ? "text-positive!" : "text-negative!"
          }
        >
          {message.text}
        </AuthText>
      )}
    </div>
  );
}
