import { tryit } from "radash";

import { isSimpleSuccess, verifyCurrentPassword } from "@/entities/account";

import { exitAccount } from "../api/withdraw-api";

export type WithdrawalResult = "done" | "wrongPassword" | "failed";

/**
 * 비밀번호를 확인한 뒤 탈퇴를 처리함(v2는 이 사이에 `POST /transfer/false`가 있었으나 v3는 필요 없음, 2026-10-22 결정).
 * 요청 자체가 실패하면 비밀번호가 틀린 것과 구분해 "failed"로 돌려줌(v2는 이 경우 아무 안내도 없었음).
 */
export async function submitWithdrawal(password: string) {
  const [checkError, isMatched] = await tryit(verifyCurrentPassword)(password);
  if (checkError) return "failed" satisfies WithdrawalResult;
  if (!isMatched) return "wrongPassword" satisfies WithdrawalResult;

  const [exitError, response] = await tryit(exitAccount)();
  if (exitError || !isSimpleSuccess(response)) {
    return "failed" satisfies WithdrawalResult;
  }
  return "done" satisfies WithdrawalResult;
}
