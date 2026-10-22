import { serverApiV3 } from "@/shared/api";

import { transformBankAccountToViewModel } from "../lib/transform-bank-account";
import { bankAccountResponseSchema, bankListSchema } from "../model/schema";

export interface BankAccountBody {
  bankIdx: number;
  accountHolder: string;
  /** 하이픈 없이 숫자만(Swagger). */
  accountNumber: string;
}

export async function fetchBankAccount() {
  const response = await serverApiV3.get("/mypage/account/bank");
  return transformBankAccountToViewModel(
    bankAccountResponseSchema.parse(response),
  );
}

export async function fetchBankList() {
  const response = await serverApiV3.get("/mypage/account/bank/list");
  return bankListSchema.parse(response).bankList;
}

/**
 * 항상 HTTP 200이고, 정산 기간(매월 5~10일) 거부는 `{ result: true, reason: "denied" }`로 옴.
 * 응답은 호출하는 쪽이 `readResultFailure`로 판독함.
 */
export function saveBankAccount(body: BankAccountBody) {
  return serverApiV3.post("/mypage/account/bank", body);
}

/** 회사정보가 먼저 등록돼 있어야 함(스펙 §3 계좌정보 진입 조건). */
export function uploadBankBook(file: File) {
  const body = new FormData();
  body.append("file", file);
  return serverApiV3.post("/mypage/account/bank/upload", body);
}
