import { tryit } from "radash";

import { isSimpleSuccess, verifyCurrentPassword } from "@/entities/account";

import { exitAccount } from "../api/withdraw-api";

export type WithdrawalResult = "done" | "wrongPassword" | "failed";

/**
 * 비밀번호를 확인한 뒤 탈퇴를 처리함.
 * 요청 자체가 실패하면 비밀번호가 틀린 것과 구분해 "failed"로 돌려줌.
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
