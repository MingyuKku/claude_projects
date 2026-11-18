/** 출금 요청의 `V3ErrorResponse.reason`. */
export const WITHDRAW_REASON = {
  invalidBank: "INVALID_BANK",
  invalidAccountNumber: "INVALID_ACCOUNT_NUMBER",
  invalidAccountHolder: "INVALID_ACCOUNT_HOLDER",
  bankBookRequired: "BANK_BOOK_REQUIRED",
  invalidBankBookFile: "INVALID_BANK_BOOK_FILE",
  zeroBalance: "ZERO_BALANCE",
  pendingWithdrawalExists: "PENDING_WITHDRAWAL_EXISTS",
  balanceChanged: "BALANCE_CHANGED",
} as const;
