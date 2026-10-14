import { tryit } from "radash";
import { useState } from "react";

import { AuthButton, AuthInput, AuthText } from "@/shared/components/auth";
import { cn } from "@/shared/lib";

import {
  idEmailSend,
  idEmailVerify,
  idKakaoSend,
  idKakaoVerify,
} from "../api/find-api";
import { isValidEmail, mapFindError } from "../lib/find-error";
import { readEmailData, readEmailReason } from "../lib/find-error";
import {
  INVALID_EMAIL_MESSAGE,
  MAX_SEND_COUNT,
  REQUEST_AGAIN_MESSAGE,
} from "../model/constants";
import { useCertFlow } from "../model/use-cert-flow";
import { CertCodeInput } from "./CertCodeInput";
import { CertContactField } from "./CertContactField";
import { CertMethodChooser } from "./CertMethodChooser";
import { CertPopups } from "./CertPopups";

interface Props {
  onClickGoLogin: () => void;
  onClickGoFindPassword: () => void;
  className?: string;
}

export function IdFind({
  onClickGoLogin,
  onClickGoFindPassword,
  className,
}: Props) {
  const flow = useCertFlow();
  const [name, setName] = useState("");
  const [foundId, setFoundId] = useState<string | null>(null);

  const contact = flow.method === "email" ? flow.email : flow.phone;
  const isSendDisabled = !name || !contact || flow.isSending;

  async function sendEmail() {
    if (!isValidEmail(flow.email)) {
      flow.setMessage({ text: INVALID_EMAIL_MESSAGE, tone: "negative" });
      return;
    }
    const [error, response] = await tryit(idEmailSend)(name, flow.email);
    if (error) {
      flow.showEmailError(error);
      return;
    }
    if (response.result !== "success") return;
    flow.countdown.start();
    // Remaining count only comes with the resend response.
    const suffix = flow.isCertSent
      ? `\n(남은횟수 ${response.count}회/${MAX_SEND_COUNT}회)`
      : "";
    flow.setMessage({
      text: `인증번호를 메일로 전송했습니다${suffix}`,
      tone: "positive",
    });
    flow.setIsCertSent(true);
  }

  function handleSend() {
    void flow.runSend(async () => {
      flow.setMessage(null);
      flow.setIsResendPopupOpen(false);
      if (flow.method === "email") {
        await sendEmail();
        return;
      }
      await flow.requestKakaoCode(() => idKakaoSend(name, flow.phone));
    });
  }

  async function verifyEmail(code: string) {
    const [error, response] = await tryit(idEmailVerify)(
      name,
      flow.email,
      code,
    );
    if (error) {
      const reason = readEmailReason(error);
      if (reason === "never requested") {
        flow.setAlertMessage(REQUEST_AGAIN_MESSAGE);
        return;
      }
      flow.setMessage({
        text: mapFindError(reason, readEmailData(error)),
        tone: "negative",
      });
      return;
    }
    if (response.result === "success" && response.id) {
      flow.countdown.stop();
      setFoundId(response.id);
    }
  }

  async function verifyKakao(code: string) {
    if (flow.verificationId === null) {
      flow.setAlertMessage(REQUEST_AGAIN_MESSAGE);
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

  function handleVerify(code: string) {
    if (!flow.canVerify()) return;
    void (flow.method === "email" ? verifyEmail(code) : verifyKakao(code));
  }

  if (foundId) {
    return (
      <div className={cn("flex flex-col gap-4", className)}>
        <AuthText size="md">회원님의 아이디는 {foundId}입니다</AuthText>
        <div className="h-12">
          <AuthButton color="primary" onClick={onClickGoLogin}>
            <AuthText as="span" size="md" className="text-inherit!">
              로그인
            </AuthText>
          </AuthButton>
        </div>
        <div className="h-12">
          <AuthButton color="light" onClick={onClickGoFindPassword}>
            <AuthText as="span" size="md" className="text-inherit!">
              비밀번호 찾기
            </AuthText>
          </AuthButton>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("flex min-h-0 flex-1 flex-col", className)}>
      <div className="flex min-h-0 flex-1 flex-col gap-12 overflow-y-auto tablet:flex-none">
        <div className="flex flex-col gap-5">
          <div className="h-11">
            <AuthInput
              aria-label="이름"
              autoComplete="name"
              placeholder="이름"
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          </div>

          {flow.method && (
            <CertContactField
              method={flow.method}
              value={contact}
              placeholder={
                flow.method === "email"
                  ? "이메일"
                  : "휴대폰 번호 ex) 01012345678"
              }
              onChangeValue={
                flow.method === "email" ? flow.setEmail : flow.setPhone
              }
              onClickSend={handleSend}
              isSendDisabled={isSendDisabled}
              // Once the code input is shown it draws the message instead.
              message={flow.isCertSent ? null : flow.message}
            />
          )}

          {flow.isCertSent && (
            <CertCodeInput
              countdownText={flow.countdown.text}
              onClickConfirm={handleVerify}
              onClickResend={handleSend}
              message={flow.message}
            />
          )}
        </div>
      </div>

      <div className="flex shrink-0 flex-col py-5 tablet:mt-12 tablet:p-0">
        {flow.method ? (
          <button
            type="button"
            onClick={flow.reset}
            className="self-center border-b border-gray-300"
          >
            <AuthText as="span" size="sm" className="text-gray-400!">
              처음으로
            </AuthText>
          </button>
        ) : (
          <CertMethodChooser
            isDisabled={!name}
            onClickSelect={flow.setMethod}
          />
        )}
      </div>

      <CertPopups flow={flow} />
    </div>
  );
}
