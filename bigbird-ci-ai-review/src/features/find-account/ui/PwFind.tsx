import { tryit } from "radash";
import { useState } from "react";
import { useNavigate } from "react-router";

import { AuthButton, AuthInput, AuthText } from "@/shared/components/auth";
import { ROUTES } from "@/shared/config";
import { cn } from "@/shared/lib";

import { pwEmailSend, pwKakaoSend, pwKakaoVerify } from "../api/find-api";
import { isValidEmail } from "../lib/find-error";
import {
  INVALID_EMAIL_MESSAGE,
  REQUEST_AGAIN_MESSAGE,
} from "../model/constants";
import { useCertFlow } from "../model/use-cert-flow";
import { CertCodeInput } from "./CertCodeInput";
import { CertContactField } from "./CertContactField";
import { CertMethodChooser } from "./CertMethodChooser";
import { CertPopups } from "./CertPopups";

interface Props {
  className?: string;
}

export function PwFind({ className }: Props) {
  const navigate = useNavigate();
  const flow = useCertFlow();
  const [id, setId] = useState("");
  const [name, setName] = useState("");
  const [isVerified, setIsVerified] = useState(false);

  const contact = flow.method === "email" ? flow.email : flow.phone;
  const isSendDisabled = !id || !name || !contact || flow.isSending;

  // The email path has no code step: the reset link is mailed and the next screen
  // only tells the user to check their inbox.
  async function sendEmail() {
    if (!isValidEmail(flow.email)) {
      flow.setMessage({ text: INVALID_EMAIL_MESSAGE, tone: "negative" });
      return;
    }
    const [error, response] = await tryit(pwEmailSend)(id, name, flow.email);
    if (error) {
      flow.showEmailError(error);
      return;
    }
    if (response.result === "success") void navigate(ROUTES.findEmailSent);
  }

  function handleSend() {
    void flow.runSend(async () => {
      flow.setMessage(null);
      flow.setIsResendPopupOpen(false);
      if (flow.method === "email") {
        await sendEmail();
        return;
      }
      await flow.requestKakaoCode(() => pwKakaoSend(id, name, flow.phone));
    });
  }

  async function verifyKakao(code: string) {
    if (flow.verificationId === null) {
      flow.setAlertMessage(REQUEST_AGAIN_MESSAGE);
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
    // The one-time reset code is intentionally dropped: `/changePw` authenticates
    // by cookie session.
    setIsVerified(true);
  }

  function handleVerify(code: string) {
    if (!flow.canVerify()) return;
    void verifyKakao(code);
  }

  // No query string: the reset code in a URL would leave a valid credential in
  // history, Referer and proxy logs.
  function handleClickChangePassword() {
    void navigate(ROUTES.changePassword);
  }

  if (isVerified) {
    return (
      <div className={cn("h-12", className)}>
        <AuthButton color="primary" onClick={handleClickChangePassword}>
          <AuthText as="span" size="md" className="text-inherit!">
            비밀번호 변경
          </AuthText>
        </AuthButton>
      </div>
    );
  }

  return (
    <div className={cn("flex min-h-0 flex-1 flex-col", className)}>
      <div className="flex min-h-0 flex-1 flex-col gap-12 overflow-y-auto tablet:flex-none">
        <div className="flex flex-col gap-5">
          <div className="h-11">
            <AuthInput
              aria-label="가입된 아이디"
              autoComplete="username"
              placeholder="가입된 아이디"
              value={id}
              onChange={(event) => setId(event.target.value)}
            />
          </div>
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
                  : "가입 인증 휴대폰 번호 ex) 01012345678"
              }
              onChangeValue={
                flow.method === "email" ? flow.setEmail : flow.setPhone
              }
              onClickSend={handleSend}
              isSendDisabled={isSendDisabled}
              message={flow.isCertSent ? null : flow.message}
            />
          )}

          {flow.method === "phone" && flow.isCertSent && (
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
            isDisabled={!id || !name}
            onClickSelect={flow.setMethod}
          />
        )}
      </div>

      <CertPopups flow={flow} />
    </div>
  );
}
