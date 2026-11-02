import type { BankAccountBody } from "../api/bank-api";
import type { BankAccountViewModel } from "../model/schema";

export interface BankFormValues {
  /** 선택한 은행 인덱스(문자열). 선택하지 않았으면 빈 문자열. */
  bankIdx: string;
  accountNumber: string;
  accountHolder: string;
}

export function toBankFormValues(
  account: BankAccountViewModel | null,
  banks: { idx: number; name: string }[],
): BankFormValues {
  // 계좌 조회는 은행을 이름으로 주므로 목록에서 이름으로 찾음. 목록에 없으면 비워 다시 고르게 함.
  const bank = banks.find((candidate) => candidate.name === account?.bankName);
  return {
    bankIdx: bank ? String(bank.idx) : "",
    accountNumber: account?.accountNumber ?? "",
    accountHolder: account?.accountHolder ?? "",
  };
}

/** 4개 항목(은행·계좌번호·예금주·통장사본)이 모두 채워졌는지. 통장사본은 등록돼 있거나 고른 파일이 있으면 채운 것. */
export function isBankFormComplete(
  values: BankFormValues,
  file: File | null,
  account: BankAccountViewModel | null,
) {
  const hasTexts =
    values.bankIdx !== "" &&
    values.accountNumber.trim() !== "" &&
    values.accountHolder.trim() !== "";
  const hasBankBook = file !== null || Boolean(account?.hasBankBookFile);
  return hasTexts && hasBankBook;
}

/** 계좌번호는 서버가 하이픈 없이 숫자만 받으므로 하이픈·공백을 지워 보냄. */
export function toBankAccountBody(values: BankFormValues): BankAccountBody {
  return {
    bankIdx: Number(values.bankIdx),
    accountHolder: values.accountHolder.trim(),
    accountNumber: values.accountNumber.replace(/[\s-]/g, ""),
  };
}
