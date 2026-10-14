import { tryit } from "radash";
import { useState } from "react";
import { useNavigate } from "react-router";

import {
  checkStatusMessage,
  FIELD_EMPTY_MESSAGE,
  ID_HINT,
  isDeniedId,
  isValidIdFormat,
  mapValidPasswordError,
  PASSWORD_HINT,
  PASSWORD_MATCH_MESSAGE,
  PASSWORD_MISMATCH_MESSAGE,
  validatePassword,
} from "@/entities/account";
import {
  AuthButton,
  AuthHeader,
  AuthInput,
  AuthText,
  PasswordInput,
} from "@/shared/components/auth";
import { ROUTES } from "@/shared/config";

import { checkId, validPassword } from "../api/join-api";
import { readApiErrorReason } from "../lib/api-error";
import {
  canProceedFromInfo,
  isPasswordAgainMatching,
  resolveInputState,
  resolveMessageClass,
} from "../lib/gating";
import {
  ACCOUNT_INPUT_MAX_LENGTH,
  ID_CHECK_ERROR_MESSAGE,
  JOIN_STEP_PROGRESS,
} from "../model/constants";
import { useJoinStore } from "../model/join-store-context";

import type { FocusEvent } from "react";

function resolvePasswordAgainMessage(
  isTouchedEmpty: boolean,
  isMismatch: boolean,
  isMatching: boolean,
) {
  if (isTouchedEmpty) return FIELD_EMPTY_MESSAGE;
  if (isMismatch) return PASSWORD_MISMATCH_MESSAGE;
  if (isMatching) return PASSWORD_MATCH_MESSAGE;
  return "";
}

export function JoinInfoStep() {
  const id = useJoinStore((state) => state.account.id);
  const password = useJoinStore((state) => state.account.password);
  const passwordAgain = useJoinStore((state) => state.account.passwordAgain);
  const idStatus = useJoinStore((state) => state.account.idStatus);
  const certIdx = useJoinStore((state) => state.account.certIdx);
  const patchAccount = useJoinStore((state) => state.patchAccount);
  const setStage = useJoinStore((state) => state.setStage);
  const navigate = useNavigate();

  const [idFormatError, setIdFormatError] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);
  // The "empty" notice only shows after the field was focused and left.
  const [isPasswordAgainTouched, setIsPasswordAgainTouched] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleBlurId(event: FocusEvent<HTMLInputElement>) {
    const value = event.target.value;
    if (!value) {
      setIdFormatError(FIELD_EMPTY_MESSAGE);
      return;
    }
    if (!isValidIdFormat(value)) {
      setIdFormatError(ID_HINT);
      return;
    }
    if (isDeniedId(value)) {
      patchAccount({ idStatus: "wrong" });
      return;
    }
    setIdFormatError("");
    const [error, response] = await tryit(checkId)(value);
    if (error) {
      setIdFormatError(ID_CHECK_ERROR_MESSAGE);
      return;
    }
    patchAccount({ idStatus: response.result > 0 ? "wrong" : "possible" });
  }

  const idMessage = idFormatError || checkStatusMessage(idStatus, "아이디");
  const idMessageClass = resolveMessageClass(
    Boolean(idFormatError) || idStatus === "wrong",
    idStatus === "possible",
  );

  const isPasswordAgainMatch = isPasswordAgainMatching(password, passwordAgain);
  const isPasswordAgainMismatch =
    passwordAgain !== "" && password !== passwordAgain;
  const isPasswordAgainEmpty = isPasswordAgainTouched && passwordAgain === "";
  const passwordAgainMessage = resolvePasswordAgainMessage(
    isPasswordAgainEmpty,
    isPasswordAgainMismatch,
    isPasswordAgainMatch,
  );

  const canSubmit = canProceedFromInfo({
    id,
    password,
    passwordAgain,
    idStatus,
    passwordError,
  });

  async function handleSubmit() {
    if (!canSubmit || certIdx === null) return;
    setSubmitError("");
    setIsSubmitting(true);
    // The server checks the password against the id and personal data once more; client validation is not final.
    const [error, response] = await tryit(validPassword)(id, password, certIdx);
    setIsSubmitting(false);
    if (error) {
      setSubmitError(mapValidPasswordError(readApiErrorReason(error)));
      return;
    }
    if (response.result) {
      setStage("company");
      return;
    }
    setSubmitError(mapValidPasswordError(response.reason));
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <AuthHeader
        title="회원가입"
        onClickBack={() => navigate(ROUTES.login)}
        progress={JOIN_STEP_PROGRESS.info}
      />

      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="flex flex-col gap-5 pt-[30px] tablet:gap-6 tablet:pt-6">
          <AuthText size="xl" weight="medium" className="text-heading!">
            1. 가입 정보 입력
          </AuthText>

          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <div className="flex flex-col gap-2.5">
                <AuthText size="md" required>
                  아이디
                </AuthText>
                <AuthInput
                  name="joinId"
                  autoComplete="off"
                  aria-label="아이디"
                  placeholder="아이디"
                  maxLength={ACCOUNT_INPUT_MAX_LENGTH}
                  value={id}
                  onChange={(event) => {
                    patchAccount({ id: event.target.value, idStatus: "idle" });
                    setIdFormatError("");
                  }}
                  onBlur={handleBlurId}
                  state={resolveInputState(
                    Boolean(idFormatError) || idStatus === "wrong",
                    idStatus === "possible",
                  )}
                />
              </div>
              {idMessage && (
                <AuthText size="sm" role="status" className={idMessageClass}>
                  {idMessage}
                </AuthText>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex flex-col gap-2.5">
                <AuthText size="md" required>
                  비밀번호
                </AuthText>
                <PasswordInput
                  name="joinPassword"
                  autoComplete="new-password"
                  label="비밀번호"
                  placeholder="영문, 숫자 포함 8자리 이상"
                  maxLength={ACCOUNT_INPUT_MAX_LENGTH}
                  value={password}
                  state={passwordError ? "error" : "default"}
                  onChange={(event) => {
                    const value = event.target.value;
                    patchAccount({ password: value });
                    setPasswordError(
                      value ? validatePassword(value, id) : null,
                    );
                  }}
                  onBlur={(event) => {
                    if (!event.target.value)
                      setPasswordError(FIELD_EMPTY_MESSAGE);
                  }}
                />
              </div>
              {/* The rule hint is always visible; a violation swaps the same slot to red text. */}
              <AuthText
                size="sm"
                className={passwordError ? "text-negative!" : "text-gray-400!"}
              >
                {passwordError || PASSWORD_HINT}
              </AuthText>
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex flex-col gap-2.5">
                <AuthText size="md" required>
                  비밀번호 확인
                </AuthText>
                <PasswordInput
                  name="joinPasswordConfirm"
                  autoComplete="new-password"
                  label="비밀번호 확인"
                  placeholder="비밀번호 확인"
                  maxLength={ACCOUNT_INPUT_MAX_LENGTH}
                  value={passwordAgain}
                  state={resolveInputState(
                    isPasswordAgainEmpty || isPasswordAgainMismatch,
                    isPasswordAgainMatch,
                  )}
                  onChange={(event) => {
                    patchAccount({ passwordAgain: event.target.value });
                    setIsPasswordAgainTouched(false);
                  }}
                  onBlur={(event) =>
                    setIsPasswordAgainTouched(!event.target.value)
                  }
                />
              </div>
              {passwordAgainMessage && (
                <AuthText
                  size="sm"
                  role="status"
                  className={
                    isPasswordAgainMatch ? "text-positive!" : "text-negative!"
                  }
                >
                  {passwordAgainMessage}
                </AuthText>
              )}
            </div>
          </div>
        </div>

        {submitError && (
          <AuthText size="sm" role="alert" className="text-negative!">
            {submitError}
          </AuthText>
        )}
      </div>

      <div className="shrink-0 py-5 tablet:pb-[70px] desktop:pb-[120px]">
        <div className="h-12">
          <AuthButton
            color="primary"
            onClick={handleSubmit}
            disabled={!canSubmit || isSubmitting}
          >
            <AuthText as="span" className="text-light!">
              다음
            </AuthText>
          </AuthButton>
        </div>
      </div>

      {import.meta.env.DEV && (
        <button
          type="button"
          className="text-gray-400! underline"
          onClick={() => setStage("company")}
        >
          <AuthText as="span" size="sm">
            [DEV] 다음 단계로 건너뛰기
          </AuthText>
        </button>
      )}
    </div>
  );
}
