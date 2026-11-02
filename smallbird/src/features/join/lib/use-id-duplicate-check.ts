import { tryit } from "radash";
import { useState } from "react";

import { isDeniedId, isValidIdFormat } from "@/entities/account";

import { checkId } from "../api/join-api";

import type { AccountFields } from "../model/types";

/** 번역 키(`info.{code}`). */
export type IdErrorCode = "empty" | "idHint" | "idCheckError";

interface UseIdDuplicateCheckParams {
  patchAccount: (patch: Partial<AccountFields>) => void;
}

/** 아이디 입력의 형식 검사와 중복확인(포커스 이탈 시)을 맡음. */
export function useIdDuplicateCheck({
  patchAccount,
}: UseIdDuplicateCheckParams) {
  const [idFormatError, setIdFormatError] = useState<IdErrorCode | null>(null);

  function clearIdFormatError() {
    setIdFormatError(null);
  }

  async function verifyId(value: string) {
    if (!value) {
      setIdFormatError("empty");
      return;
    }
    if (!isValidIdFormat(value)) {
      setIdFormatError("idHint");
      return;
    }
    if (isDeniedId(value)) {
      patchAccount({ idStatus: "wrong" });
      return;
    }
    setIdFormatError(null);
    const [error, response] = await tryit(checkId)(value);
    if (error) {
      setIdFormatError("idCheckError");
      return;
    }
    patchAccount({ idStatus: response.result > 0 ? "wrong" : "possible" });
  }

  return { idFormatError, clearIdFormatError, verifyId };
}
