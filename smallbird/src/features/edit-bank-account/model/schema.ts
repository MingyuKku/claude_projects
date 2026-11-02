import { z } from "zod";

// `GET /v3/mypage/account/bank`(Swagger `BankInfoResponse`). 항상 HTTP 200이고, 미등록은
// `{ result: false, reason }`로 와서 나머지 필드는 없음.
export const bankAccountResponseSchema = z.object({
  result: z.boolean(),
  /** 은행명. 계좌 조회는 은행을 이름으로 줌. */
  bank: z.string().nullish(),
  accountNumber: z.string().nullish(),
  accountHolder: z.string().nullish(),
  isExistsBankBookFile: z.boolean().nullish(),
  /** 통장 사본 원본 파일명(확장자 포함). 미등록이면 null. */
  bankBookFileName: z.string().nullish(),
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
  /** 등록된 통장 사본 파일명. 미등록이거나 서버가 이름을 주지 않으면 null. */
  bankBookFileName: string | null;
}
