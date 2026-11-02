import { tryit } from "radash";
import { useRef, useState } from "react";

import { isValidEmailFormat } from "@/entities/account";

import { checkEmail } from "../api/join-api";
import { EMAIL_CHECK_DEBOUNCE_MS } from "../model/constants";

import type { AccountFields } from "../model/types";
import type { CheckStatus } from "@/entities/account";

/** 번역 키(`company.{code}`). */
export type EmailErrorCode = "emailFormatError" | "emailCheckError" | "empty";

interface UseEmailDuplicateCheckParams {
  email: string;
  emailStatus: CheckStatus;
  patchAccount: (patch: Partial<AccountFields>) => void;
}

/** 이메일 입력의 형식 검사와 중복확인(입력 멈춤 후 자동, 포커스 이탈 시 보충)을 맡음. */
export function useEmailDuplicateCheck({
  email,
  emailStatus,
  patchAccount,
}: UseEmailDuplicateCheckParams) {
  const [emailError, setEmailError] = useState<EmailErrorCode | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function cancelPendingCheck() {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
  }

  async function runEmailCheck(value: string) {
    const [error, response] = await tryit(checkEmail)(value);
    if (error) {
      setEmailError("emailCheckError");
      return;
    }
    patchAccount({ emailStatus: response.result > 0 ? "wrong" : "possible" });
  }

  function changeEmail(value: string) {
    patchAccount({ email: value, emailStatus: "idle" });
    setEmailError(null);

    cancelPendingCheck();
    if (isValidEmailFormat(value)) {
      timer.current = setTimeout(
        () => void runEmailCheck(value),
        EMAIL_CHECK_DEBOUNCE_MS,
      );
    }
  }

  function blurEmail() {
    cancelPendingCheck();
    if (!email) {
      setEmailError("empty");
      return;
    }
    if (!isValidEmailFormat(email)) {
      setEmailError("emailFormatError");
      return;
    }
    // 입력 멈춤 확인이 이미 결과를 냈다면 다시 묻지 않음.
    if (emailStatus === "possible" || emailStatus === "wrong") return;
    void runEmailCheck(email);
  }

  return { emailError, changeEmail, blurEmail };
}
