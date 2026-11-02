import { useState } from "react";
import { useNavigate } from "react-router";

import { getPasswordError } from "@/entities/account";
import {
  AuthButton,
  AuthHeader,
  AuthInput,
  AuthText,
  PasswordInput,
} from "@/shared/components/auth";
import { ROUTES } from "@/shared/config";
import { useTranslation } from "@/shared/i18n";

import {
  canProceedFromInfo,
  isPasswordAgainMatching,
  resolveInputState,
  resolveMessageClass,
} from "../lib/gating";
import { useIdDuplicateCheck } from "../lib/use-id-duplicate-check";
import { useValidatePassword } from "../lib/use-validate-password";
import {
  ACCOUNT_INPUT_MAX_LENGTH,
  JOIN_STEP_PROGRESS,
} from "../model/constants";
import { useJoinStore } from "../model/join-store-context";

import type { CheckStatus, PasswordErrorCode } from "@/entities/account";
import type { ChangeEvent, FocusEvent } from "react";

type PasswordFieldError = PasswordErrorCode | "empty";
type PasswordAgainMessage = "empty" | "passwordMismatch" | "passwordMatch";

/** 중복확인 상태 중 안내 문구가 있는 것만 고름. */
function isIdStatusWithMessage(
  status: CheckStatus,
): status is "wrong" | "possible" | "needCheck" {
  return status === "wrong" || status === "possible" || status === "needCheck";
}

function resolvePasswordAgainMessage(
  isTouchedEmpty: boolean,
  isMismatch: boolean,
  isMatching: boolean,
): PasswordAgainMessage | null {
  if (isTouchedEmpty) return "empty";
  if (isMismatch) return "passwordMismatch";
  if (isMatching) return "passwordMatch";
  return null;
}

export function JoinInfoStep() {
  const { t } = useTranslation("features/join");
  const { t: tCommon } = useTranslation();
  const id = useJoinStore((state) => state.account.id);
  const password = useJoinStore((state) => state.account.password);
  const passwordAgain = useJoinStore((state) => state.account.passwordAgain);
  const idStatus = useJoinStore((state) => state.account.idStatus);
  const certIdx = useJoinStore((state) => state.account.certIdx);
  const patchAccount = useJoinStore((state) => state.patchAccount);
  const setStage = useJoinStore((state) => state.setStage);
  const navigate = useNavigate();
  const { idFormatError, clearIdFormatError, verifyId } = useIdDuplicateCheck({
    patchAccount,
  });
  const { serverError, isValidating, validate } = useValidatePassword({
    id,
    password,
    certIdx,
    onValid: () => setStage("company"),
  });

  const [passwordError, setPasswordError] = useState<PasswordFieldError | null>(
    null,
  );
  // 비밀번호 확인의 "비어 있음" 안내는 입력란에 포커스했다가 비운 채 벗어난 뒤에만 보임.
  const [isPasswordAgainTouched, setIsPasswordAgainTouched] = useState(false);

  const isIdError = Boolean(idFormatError) || idStatus === "wrong";
  const isIdPossible = idStatus === "possible";
  let idMessage = "";
  if (idFormatError) idMessage = t(`info.${idFormatError}`);
  else if (isIdStatusWithMessage(idStatus)) {
    idMessage = t(`info.idStatus.${idStatus}`);
  }
  const idMessageClass = resolveMessageClass(isIdError, isIdPossible);

  let passwordMessage = t("info.passwordHint");
  if (passwordError === "empty") passwordMessage = t("info.empty");
  else if (passwordError) {
    passwordMessage = t(`info.passwordError.${passwordError}`);
  }
  const passwordMessageClass = resolveMessageClass(
    Boolean(passwordError),
    false,
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
  const passwordAgainMessageClass = resolveMessageClass(
    !isPasswordAgainMatch,
    isPasswordAgainMatch,
  );

  const canSubmit = canProceedFromInfo({
    id,
    password,
    passwordAgain,
    idStatus,
    passwordError,
  });

  function handleClickBack() {
    void navigate(ROUTES.login);
  }

  function handleChangeId(event: ChangeEvent<HTMLInputElement>) {
    patchAccount({ id: event.target.value, idStatus: "idle" });
    clearIdFormatError();
  }

  function handleBlurId(event: FocusEvent<HTMLInputElement>) {
    void verifyId(event.target.value);
  }

  function handleChangePassword(event: ChangeEvent<HTMLInputElement>) {
    const value = event.target.value;
    patchAccount({ password: value });
    setPasswordError(value ? getPasswordError(value, id) : null);
  }

  function handleBlurPassword(event: FocusEvent<HTMLInputElement>) {
    if (!event.target.value) setPasswordError("empty");
  }

  function handleChangePasswordAgain(event: ChangeEvent<HTMLInputElement>) {
    patchAccount({ passwordAgain: event.target.value });
    setIsPasswordAgainTouched(false);
  }

  function handleBlurPasswordAgain(event: FocusEvent<HTMLInputElement>) {
    setIsPasswordAgainTouched(!event.target.value);
  }

  function handleClickNext() {
    if (!canSubmit) return;
    void validate();
  }

  function handleClickSkip() {
    setStage("company");
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <AuthHeader
        title={t("header")}
        onClickBack={handleClickBack}
        progress={JOIN_STEP_PROGRESS.info}
      />

      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="flex flex-col gap-5 pt-[30px] tablet:gap-6 tablet:pt-6">
          <AuthText size="xl" weight="medium" tone="heading">
            {t("info.title")}
          </AuthText>

          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <div className="flex flex-col gap-2.5">
                <AuthText size="md" isRequired>
                  {tCommon("field.id")}
                </AuthText>
                <AuthInput
                  name="joinId"
                  autoComplete="off"
                  aria-label={tCommon("field.id")}
                  placeholder={tCommon("field.id")}
                  maxLength={ACCOUNT_INPUT_MAX_LENGTH}
                  value={id}
                  onChange={handleChangeId}
                  onBlur={handleBlurId}
                  state={resolveInputState(isIdError, isIdPossible)}
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
                <AuthText size="md" isRequired>
                  {tCommon("field.password")}
                </AuthText>
                <PasswordInput
                  name="joinPassword"
                  autoComplete="new-password"
                  label={tCommon("field.password")}
                  placeholder={t("info.passwordPlaceholder")}
                  maxLength={ACCOUNT_INPUT_MAX_LENGTH}
                  value={password}
                  state={passwordError ? "error" : "default"}
                  onChange={handleChangePassword}
                  onBlur={handleBlurPassword}
                />
              </div>
              {/* 규칙 안내는 항상 보이고, 위반하면 같은 자리가 빨간 글씨로 바뀜. */}
              <AuthText size="sm" className={passwordMessageClass}>
                {passwordMessage}
              </AuthText>
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex flex-col gap-2.5">
                <AuthText size="md" isRequired>
                  {t("info.checkLabel")}
                </AuthText>
                <PasswordInput
                  name="joinPasswordConfirm"
                  autoComplete="new-password"
                  label={t("info.checkLabel")}
                  placeholder={t("info.checkPlaceholder")}
                  maxLength={ACCOUNT_INPUT_MAX_LENGTH}
                  value={passwordAgain}
                  state={resolveInputState(
                    isPasswordAgainEmpty || isPasswordAgainMismatch,
                    isPasswordAgainMatch,
                  )}
                  onChange={handleChangePasswordAgain}
                  onBlur={handleBlurPasswordAgain}
                />
              </div>
              {passwordAgainMessage && (
                <AuthText
                  size="sm"
                  role="status"
                  className={passwordAgainMessageClass}
                >
                  {t(`info.${passwordAgainMessage}`)}
                </AuthText>
              )}
            </div>
          </div>
        </div>

        {serverError && (
          <AuthText size="sm" role="alert" tone="negative">
            {t(`info.serverPasswordError.${serverError}`)}
          </AuthText>
        )}
      </div>

      <div className="shrink-0 py-5 tablet:pb-[70px] desktop:pb-[120px]">
        <div className="h-12">
          <AuthButton
            color="primary"
            onClick={handleClickNext}
            disabled={!canSubmit || isValidating}
          >
            <AuthText as="span" tone="light">
              {t("next")}
            </AuthText>
          </AuthButton>
        </div>
      </div>

      {import.meta.env.DEV && (
        <button
          type="button"
          className="text-gray-400 underline"
          onClick={handleClickSkip}
        >
          <AuthText as="span" size="sm">
            {t("dev.skipStep")}
          </AuthText>
        </button>
      )}
    </div>
  );
}
