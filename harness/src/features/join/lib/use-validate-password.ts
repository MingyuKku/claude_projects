import { tryit } from "radash";
import { useState } from "react";

import { mapValidPasswordError } from "@/entities/account";

import { validPassword } from "../api/join-api";
import { readApiErrorReason } from "./api-error";

import type { ValidPasswordErrorCode } from "@/entities/account";

interface UseValidatePasswordParams {
  id: string;
  password: string;
  certIdx: number | null;
  onValid: () => void;
}

/** 클라이언트 검증과 별개로, 서버가 아이디·개인정보와 비교해 비밀번호를 한 번 더 검증함. */
export function useValidatePassword({
  id,
  password,
  certIdx,
  onValid,
}: UseValidatePasswordParams) {
  const [serverError, setServerError] = useState<ValidPasswordErrorCode | null>(
    null,
  );
  const [isValidating, setIsValidating] = useState(false);

  async function validate() {
    if (certIdx === null) return;
    setServerError(null);
    setIsValidating(true);
    const [error, response] = await tryit(validPassword)(id, password, certIdx);
    setIsValidating(false);
    if (error) {
      setServerError(mapValidPasswordError(readApiErrorReason(error)));
      return;
    }
    if (response.result) {
      onValid();
      return;
    }
    setServerError(mapValidPasswordError(response.reason));
  }

  return { serverError, isValidating, validate };
}
