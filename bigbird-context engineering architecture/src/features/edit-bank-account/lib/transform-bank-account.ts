import type { BankAccountViewModel } from "../model/schema";
import type { bankAccountResponseSchema } from "../model/schema";
import type { z } from "zod";

type BankAccountResponse = z.infer<typeof bankAccountResponseSchema>;

/** 미등록(`result: false`)이면 null. */
export function transformBankAccountToViewModel(
  response: BankAccountResponse,
): BankAccountViewModel | null {
  if (!response.result) return null;
  return {
    bankName: response.bank ?? "",
    accountNumber: response.accountNumber ?? "",
    accountHolder: response.accountHolder ?? "",
    hasBankBookFile: Boolean(response.isExistsBankBookFile),
  };
}
