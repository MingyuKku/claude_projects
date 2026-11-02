import { tryit } from "radash";
import { useState } from "react";

import {
  idEmailSend,
  idEmailVerify,
  idKakaoSend,
  idKakaoVerify,
} from "../api/find-api";
import { isValidEmail } from "../lib/find-error";
import { RESULT_SUCCESS } from "./constants";

import type { CertFlow } from "./use-cert-flow";

/** 아이디 찾기의 인증번호 발송·확인과 조회된 아이디 상태를 맡음. */
export function useIdLookup(flow: CertFlow, name: string) {
  const [foundId, setFoundId] = useState<string | null>(null);

  async function handleSendEmailCode() {
    if (!isValidEmail(flow.contact)) {
      flow.showInvalidEmail();
      return;
    }
    const [error, response] = await tryit(idEmailSend)(name, flow.contact);
    if (error) {
      flow.showEmailError(error);
      return;
    }
    if (response.result !== RESULT_SUCCESS) return;
    flow.markEmailSent(response.count);
  }

  function handleSendCode() {
    void flow.runSend(async () => {
      if (flow.isEmailMethod) {
        await handleSendEmailCode();
        return;
      }
      await flow.requestKakaoCode(() => idKakaoSend(name, flow.contact));
    });
  }

  async function handleVerifyEmailCode(code: string) {
    const [error, response] = await tryit(idEmailVerify)(
      name,
      flow.contact,
      code,
    );
    if (error) {
      flow.showEmailVerifyError(error);
      return;
    }
    if (response.result === RESULT_SUCCESS && response.id) {
      flow.countdown.stop();
      setFoundId(response.id);
    }
  }

  async function handleVerifyKakaoCode(code: string) {
    if (flow.verificationId === null) {
      flow.alertRequestAgain();
      return;
    }
    const [error, response] = await tryit(idKakaoVerify)(
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
    setFoundId(response.data.loginId);
  }

  function handleVerifyCode(code: string) {
    if (!flow.clearMessageAndCheckNotExpired()) return;
    void (flow.isEmailMethod
      ? handleVerifyEmailCode(code)
      : handleVerifyKakaoCode(code));
  }

  return { foundId, handleSendCode, handleVerifyCode };
}
