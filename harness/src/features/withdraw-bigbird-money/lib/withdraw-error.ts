import { readFailureReason } from "@/entities/account";

import { WITHDRAW_REASON } from "../model/constants";

export type WithdrawField =
  "bank" | "accountNumber" | "accountHolder" | "bankBook";
/** 입력 칸 아래에 보이는 오류 문구 키(`error.*`). */
export type WithdrawFieldError =
  | "invalidBank"
  | "invalidAccountNumber"
  | "invalidAccountHolder"
  | "bankBookRequired"
  | "fileExtension"
  | "fileSize";

export type WithdrawFailure =
  | { kind: "field"; field: WithdrawField; error: WithdrawFieldError }
  | { kind: "zeroBalance" }
  | { kind: "pending" }
  | { kind: "balanceChanged" }
  | { kind: "unknown" };

/** 서버 `reason`을 화면 처리 종류로 바꿈. 403·500·네트워크·모르는 reason은 모두 unknown. */
export function classifyWithdrawError(error: unknown): WithdrawFailure {
  switch (readFailureReason(error)) {
    case WITHDRAW_REASON.invalidBank:
      return { kind: "field", field: "bank", error: "invalidBank" };
    case WITHDRAW_REASON.invalidAccountNumber:
      return {
        kind: "field",
        field: "accountNumber",
        error: "invalidAccountNumber",
      };
    case WITHDRAW_REASON.invalidAccountHolder:
      return {
        kind: "field",
        field: "accountHolder",
        error: "invalidAccountHolder",
      };
    case WITHDRAW_REASON.bankBookRequired:
      return { kind: "field", field: "bankBook", error: "bankBookRequired" };
    case WITHDRAW_REASON.invalidBankBookFile:
      return { kind: "field", field: "bankBook", error: "fileExtension" };
    case WITHDRAW_REASON.zeroBalance:
      return { kind: "zeroBalance" };
    case WITHDRAW_REASON.pendingWithdrawalExists:
      return { kind: "pending" };
    case WITHDRAW_REASON.balanceChanged:
      return { kind: "balanceChanged" };
    default:
      return { kind: "unknown" };
  }
}
