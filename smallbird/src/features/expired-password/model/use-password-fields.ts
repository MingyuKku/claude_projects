import { useState } from "react";

import { isValidNewPassword } from "../lib/validate-new-password";

import type { ChangeEvent } from "react";

/**
 * 만료 비밀번호 변경 폼의 입력값과 입력 중 검증 상태를 관리함.
 * `previousPassword`는 직전 로그인에 쓴 비밀번호.
 */
export function usePasswordFields(previousPassword: string | undefined) {
  const [originPassword, setOriginPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newPasswordCheck, setNewPasswordCheck] = useState("");
  const [isOriginWrong, setIsOriginWrong] = useState(false);
  const [hasNewPasswordError, setHasNewPasswordError] = useState(false);
  const [isCheckMismatch, setIsCheckMismatch] = useState(false);

  const canSubmit = Boolean(
    originPassword &&
    newPassword &&
    newPasswordCheck &&
    !hasNewPasswordError &&
    !isCheckMismatch,
  );

  function handleChangeOrigin(event: ChangeEvent<HTMLInputElement>) {
    const value = event.target.value;
    setOriginPassword(value);
    // 직전 로그인에 쓴 값과 다른지 알려 주는 UX 힌트이며, 실제 확인은 서버가 함.
    setIsOriginWrong(value !== "" && value !== previousPassword);
  }

  function handleChangeNew(event: ChangeEvent<HTMLInputElement>) {
    const value = event.target.value;
    setNewPassword(value);
    setHasNewPasswordError(Boolean(value) && !isValidNewPassword(value));
    if (newPasswordCheck) setIsCheckMismatch(value !== newPasswordCheck);
  }

  function handleChangeCheck(event: ChangeEvent<HTMLInputElement>) {
    const value = event.target.value;
    setNewPasswordCheck(value);
    setIsCheckMismatch(Boolean(value) && value !== newPassword);
  }

  return {
    originPassword,
    newPassword,
    newPasswordCheck,
    isOriginWrong,
    hasNewPasswordError,
    isCheckMismatch,
    canSubmit,
    onChangeOrigin: handleChangeOrigin,
    onChangeNew: handleChangeNew,
    onChangeCheck: handleChangeCheck,
  };
}
