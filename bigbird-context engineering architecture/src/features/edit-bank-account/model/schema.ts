import { z } from "zod";

// Swagger에 응답 스키마가 없어 예시(성공 / 계좌정보 미등록)를 기준으로 함(docs/mypage-api.md §4-4).
// 미등록은 `{ result: false, reason: "error" }`로 와서 나머지 필드는 없음.
export const bankAccountResponseSchema = z.object({
  result: z.boolean(),
  /** 은행명. 계좌 조회는 은행을 이름으로 줌. */
  bank: z.string().nullish(),
  accountNumber: z.string().nullish(),
  accountHolder: z.string().nullish(),
  isExistsBankBookFile: z.boolean().nullish(),
});

/** `GET /v3/mypage/account/bank/list`. */
export const bankListSchema = z.object({
  bankList: z.array(z.object({ idx: z.number(), name: z.string() })),
});

export interface BankAccountViewModel {
  bankName: string;
  accountNumber: string;
  accountHolder: string;
  hasBankBookFile: boolean;
}
