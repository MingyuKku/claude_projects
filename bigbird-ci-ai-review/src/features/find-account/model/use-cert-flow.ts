import { tryit } from "radash";
import { useState } from "react";

import { useCountdown } from "@/shared/lib";

import {
  extractAuthErrorCode,
  mapAuthErrorCode,
  mapFindError,
  readEmailData,
  readEmailReason,
} from "../lib/find-error";
import {
  MAIL_SERVER_ERROR_MESSAGE,
  MAX_SEND_COUNT,
  TIME_OUT_MESSAGE,
} from "./constants";

import type { LookupResponse } from "./schemas";

export type CertMethod = "email" | "phone";

export interface CertMessage {
  text: string;
  tone: "positive" | "negative";
}

export type CertFlow = ReturnType<typeof useCertFlow>;

/**
 * State machine shared by the id and password lookups: both collect name and
 * contact, send a code and verify it, and differ only in what they look up.
 */
export function useCertFlow() {
  const [method, setMethod] = useState<CertMethod | null>(null);
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [isCertSent, setIsCertSent] = useState(false);
  const [message, setMessage] = useState<CertMessage | null>(null);
  const [isResendPopupOpen, setIsResendPopupOpen] = useState(false);
  const [alertMessage, setAlertMessage] = useState<string | null>(null);
  // Double-clicks would stack send requests and burn the remaining send count.
  const [isSending, setIsSending] = useState(false);
  /** `data.id` of the `/lookup` response, reused by `/verification/*`. */
  const [verificationId, setVerificationId] = useState<number | null>(null);
  const countdown = useCountdown();

  function startKakaoCountdown(verifyId: number, remainCount?: number) {
    setVerificationId(verifyId);
    setIsCertSent(true);
    countdown.start();
    const suffix =
      typeof remainCount === "number"
        ? `\n(남은횟수 ${remainCount}회/${MAX_SEND_COUNT}회)`
        : "";
    setMessage({
      text: `카카오톡으로 인증번호를 전송했습니다${suffix}`,
      tone: "positive",
    });
  }

  /** Inline codes show under the form, the rest need a popup. */
  function showAuthError(code: string) {
    const { message: text, isInline } = mapAuthErrorCode(code);
    if (isInline) setMessage({ text, tone: "negative" });
    else setAlertMessage(text);
  }

  function showAuthErrorFrom(error: unknown) {
    showAuthError(extractAuthErrorCode(error));
  }

  /** Mail server outage is a popup, resend throttling has its own popup, the rest is inline. */
  function showEmailError(error: unknown) {
    const reason = readEmailReason(error);
    if (reason === "mail server error") {
      setAlertMessage(MAIL_SERVER_ERROR_MESSAGE);
      return;
    }
    if (reason === "request exists") {
      setIsResendPopupOpen(true);
      return;
    }
    setMessage({
      text: mapFindError(reason, readEmailData(error)),
      tone: "negative",
    });
  }

  /** Sends a Kakao code through the given `/lookup` call and reports the outcome. */
  async function requestKakaoCode(lookup: () => Promise<LookupResponse>) {
    const [error, response] = await tryit(lookup)();
    if (error) {
      showAuthErrorFrom(error);
      return;
    }
    if (response.success) {
      startKakaoCountdown(
        response.data.id,
        response.data.remainVerificationCount,
      );
      return;
    }
    showAuthError(response.data.code);
  }

  function reset() {
    setMethod(null);
    setIsCertSent(false);
    setMessage(null);
    setEmail("");
    setPhone("");
    setIsResendPopupOpen(false);
    setVerificationId(null);
    countdown.stop();
  }

  /** Shared entry for the send button and Enter; ignored while a request is in flight. */
  async function runSend(send: () => Promise<void>) {
    if (isSending) return;
    setIsSending(true);
    await tryit(send)();
    setIsSending(false);
  }

  /**
   * Clears the message and checks the countdown. The auth server answers success
   * even after the minute is over, so expiry is judged here. This is only a UX
   * guard; real expiry must be enforced server-side.
   */
  function canVerify() {
    setMessage(null);
    if (countdown.isExpired()) {
      setMessage({ text: TIME_OUT_MESSAGE, tone: "negative" });
      return false;
    }
    return true;
  }

  return {
    method,
    setMethod,
    email,
    setEmail,
    phone,
    setPhone,
    isCertSent,
    setIsCertSent,
    message,
    setMessage,
    isResendPopupOpen,
    setIsResendPopupOpen,
    alertMessage,
    setAlertMessage,
    isSending,
    verificationId,
    countdown,
    showAuthError,
    showAuthErrorFrom,
    showEmailError,
    requestKakaoCode,
    reset,
    runSend,
    canVerify,
  };
}
