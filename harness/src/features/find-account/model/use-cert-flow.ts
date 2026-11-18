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
import { EMAIL_REASON, MAX_SEND_COUNT } from "./constants";

import type { LookupResponse } from "./schemas";
import type { FindMessage } from "./types";

export type CertMethod = "email" | "phone";

export interface CertMessage {
  content: FindMessage;
  tone: "positive" | "negative";
}

export type CertFlow = ReturnType<typeof useCertFlow>;

/**
 * 아이디·비밀번호 찾기가 공유하는 상태 머신. 둘 다 이름과 연락처를 받아
 * 인증번호를 보내고 확인하며, 무엇을 조회하느냐만 다름.
 */
export function useCertFlow() {
  const [method, setMethod] = useState<CertMethod | null>(null);
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [isCertSent, setIsCertSent] = useState(false);
  const [message, setMessage] = useState<CertMessage | null>(null);
  const [isResendPopupOpen, setIsResendPopupOpen] = useState(false);
  const [alertMessage, setAlertMessage] = useState<FindMessage | null>(null);
  // 더블클릭이 발송 요청을 겹쳐 남은 발송 횟수를 소모하는 것을 막음.
  const [isSending, setIsSending] = useState(false);
  /** `/lookup` 응답의 `data.id`이며 `/verification/*`에서 다시 씀. */
  const [verificationId, setVerificationId] = useState<number | null>(null);
  const countdown = useCountdown();

  const isEmailMethod = method === "email";
  const contact = isEmailMethod ? email : phone;

  function changeContact(value: string) {
    if (isEmailMethod) setEmail(value);
    else setPhone(value);
  }

  function closeResendPopup() {
    setIsResendPopupOpen(false);
  }

  function dismissAlert() {
    setAlertMessage(null);
  }

  function showInvalidEmail() {
    setMessage({ content: { code: "invalidEmail" }, tone: "negative" });
  }

  function alertRequestAgain() {
    setAlertMessage({ code: "requestAgain" });
  }

  function startKakaoCountdown(verifyId: number, remainCount?: number) {
    setVerificationId(verifyId);
    setIsCertSent(true);
    countdown.start();
    setMessage({
      content:
        typeof remainCount === "number"
          ? {
              code: "kakaoResent",
              values: { remaining: remainCount, max: MAX_SEND_COUNT },
            }
          : { code: "kakaoSent" },
      tone: "positive",
    });
  }

  /** 이메일 발송 성공을 반영함. 남은 횟수는 재발송 응답에만 오므로 재발송일 때만 안내함. */
  function markEmailSent(remainCount?: number) {
    countdown.start();
    setMessage({
      content:
        isCertSent && typeof remainCount === "number"
          ? {
              code: "emailResent",
              values: { remaining: remainCount, max: MAX_SEND_COUNT },
            }
          : { code: "emailSent" },
      tone: "positive",
    });
    setIsCertSent(true);
  }

  /** 인라인 코드는 폼 아래에 보이고, 나머지는 팝업이 필요함. */
  function showAuthError(code: string) {
    const { message: content, isInline } = mapAuthErrorCode(code);
    if (isInline) setMessage({ content, tone: "negative" });
    else setAlertMessage(content);
  }

  function showAuthErrorFrom(error: unknown) {
    showAuthError(extractAuthErrorCode(error));
  }

  /** 메일 서버 장애는 팝업, 재발송 제한은 전용 팝업, 나머지는 인라인으로 보여 줌. */
  function showEmailError(error: unknown) {
    const reason = readEmailReason(error);
    if (reason === EMAIL_REASON.mailServerError) {
      setAlertMessage({ code: "mailServerError" });
      return;
    }
    if (reason === EMAIL_REASON.requestExists) {
      setIsResendPopupOpen(true);
      return;
    }
    setMessage({
      content: mapFindError(reason, readEmailData(error)),
      tone: "negative",
    });
  }

  /** 인증번호 확인 실패: 발송 이력이 없으면 팝업으로 재요청을 안내하고, 나머지는 인라인. */
  function showEmailVerifyError(error: unknown) {
    const reason = readEmailReason(error);
    if (reason === EMAIL_REASON.neverRequested) {
      alertRequestAgain();
      return;
    }
    setMessage({
      content: mapFindError(reason, readEmailData(error)),
      tone: "negative",
    });
  }

  /** 주어진 `/lookup` 호출로 카카오 인증번호를 보내고 결과를 반영함. */
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

  /** 발송 버튼과 Enter의 공통 진입점. 요청 중이면 무시하고, 이전 안내 문구와 팝업을 닫고 시작함. */
  async function runSend(send: () => Promise<void>) {
    if (isSending) return;
    setIsSending(true);
    setMessage(null);
    setIsResendPopupOpen(false);
    await tryit(send)();
    setIsSending(false);
  }

  /**
   * 안내 문구를 지우고 카운트다운이 끝났는지 확인해, 확인을 이어가도 되면 true를
   * 돌려줌. 만료됐으면 문구를 남기고 false. 인증 서버는 1분이 지나도 성공으로
   * 답하므로 만료는 여기서 판단하며, 이는 UX 보호일 뿐 실제 만료는 서버가 강제해야 함.
   */
  function clearMessageAndCheckNotExpired() {
    setMessage(null);
    if (countdown.isExpired()) {
      setMessage({ content: { code: "timeOut" }, tone: "negative" });
      return false;
    }
    return true;
  }

  return {
    method,
    isEmailMethod,
    contact,
    isCertSent,
    message,
    isResendPopupOpen,
    alertMessage,
    isSending,
    verificationId,
    countdown,
    selectMethod: setMethod,
    changeContact,
    closeResendPopup,
    dismissAlert,
    showInvalidEmail,
    alertRequestAgain,
    markEmailSent,
    showAuthError,
    showAuthErrorFrom,
    showEmailError,
    showEmailVerifyError,
    requestKakaoCode,
    reset,
    runSend,
    clearMessageAndCheckNotExpired,
  };
}
