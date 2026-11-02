import { tryit } from "radash";
import { useState } from "react";
import { useNavigate } from "react-router";

import { ROUTES } from "@/shared/config";

import { pwEmailSend, pwKakaoSend, pwKakaoVerify } from "../api/find-api";
import { isValidEmail } from "../lib/find-error";
import { RESULT_SUCCESS } from "./constants";

import type { CertFlow } from "./use-cert-flow";

/** 비밀번호 찾기의 인증번호 발송·확인과 본인 확인 완료 상태를 맡음. */
export function usePwLookup(flow: CertFlow, id: string, name: string) {
  const navigate = useNavigate();
  const [isVerified, setIsVerified] = useState(false);

  // 이메일 경로에는 인증번호 단계가 없음. 재설정 링크를 메일로 보내고,
  // 다음 화면은 메일함을 확인하라고만 안내함.
  async function handleSendEmailLink() {
    if (!isValidEmail(flow.contact)) {
      flow.showInvalidEmail();
      return;
    }
    const [error, response] = await tryit(pwEmailSend)(id, name, flow.contact);
    if (error) {
      flow.showEmailError(error);
      return;
    }
    if (response.result === RESULT_SUCCESS) void navigate(ROUTES.findEmailSent);
  }

  function handleSendCode() {
    void flow.runSend(async () => {
      if (flow.isEmailMethod) {
        await handleSendEmailLink();
        return;
      }
      await flow.requestKakaoCode(() => pwKakaoSend(id, name, flow.contact));
    });
  }

  async function handleVerifyKakaoCode(code: string) {
    if (flow.verificationId === null) {
      flow.alertRequestAgain();
      return;
    }
    const [error, response] = await tryit(pwKakaoVerify)(
      flow.verificationId,
      code,
    );
    if (error) {
      flow.showAuthErrorFrom(error);
      return;
    }
    if (!response.success) {
      flow.showAuthError(response.data.code);
      return;
    }
    flow.countdown.stop();
    // 일회용 재설정 코드는 의도적으로 버림. `/changePw`는 쿠키 세션으로 인증함.
    setIsVerified(true);
  }

  function handleVerifyCode(code: string) {
    if (!flow.clearMessageAndCheckNotExpired()) return;
    void handleVerifyKakaoCode(code);
  }

  return { isVerified, handleSendCode, handleVerifyCode };
}
