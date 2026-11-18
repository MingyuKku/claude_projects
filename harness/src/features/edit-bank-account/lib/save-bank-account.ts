import { tryit } from "radash";

import {
  DENIED_REASON,
  readFailureReason,
  readResultFailure,
} from "@/entities/account";

import { saveBankAccount, uploadBankBook } from "../api/bank-api";
import { toBankAccountBody } from "./bank-form";

import type { BankFormValues } from "./bank-form";

export type BankSaveFailure = "denied" | "info" | "bankBook" | null;

export interface BankSaveResult {
  /** 계좌 정보가 서버에 반영됐는지. 통장 사본 업로드가 실패해도 true일 수 있음. */
  hasSavedInfo: boolean;
  failure: BankSaveFailure;
  /** 서버가 알려 준 실패 사유. 모르면 빈 문자열. */
  reason: string;
}

interface SaveParams {
  values: BankFormValues;
  bankBook: File | null;
}

/**
 * 계좌 정보를 먼저 저장하고 고른 통장 사본을 올림. 정산 기간(매월 5~10일)에는 서버가
 * 계좌 변경을 거부하며 `result: true, reason: "denied"`로 오므로 `result`만 보지 않음.
 */
export async function saveBankAccountWithBankBook({
  values,
  bankBook,
}: SaveParams): Promise<BankSaveResult> {
  const [infoError, infoResponse] = await tryit(saveBankAccount)(
    toBankAccountBody(values),
  );
  const infoFailure = infoError
    ? (readFailureReason(infoError) ?? "")
    : readResultFailure(infoResponse);
  if (infoError || infoFailure !== null) {
    return {
      hasSavedInfo: false,
      failure: infoFailure === DENIED_REASON ? "denied" : "info",
      reason: infoFailure ?? "",
    };
  }

  if (bankBook) {
    const [uploadError, uploadResponse] = await tryit(uploadBankBook)(bankBook);
    const uploadFailure = uploadError
      ? (readFailureReason(uploadError) ?? "")
      : readResultFailure(uploadResponse);
    if (uploadError || uploadFailure !== null) {
      return {
        hasSavedInfo: true,
        failure: "bankBook",
        reason: uploadFailure ?? "",
      };
    }
  }

  return { hasSavedInfo: true, failure: null, reason: "" };
}
