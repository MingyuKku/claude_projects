import { z } from "zod";

/** `GET /v3/mypage/bigbird-money/init` 응답. 결제 요청에는 `encryptUserIdx`, 결제창의 구매자 정보에는 나머지를 씀. */
export const chargeInitSchema = z.object({
  email: z.string().nullish(),
  name: z.string().nullish(),
  phone_number: z.string().nullish(),
  encryptUserIdx: z.string().min(1),
});

/** 값 타입이 명세에 없어 문자열·숫자를 모두 받고 폼에 넣을 때 문자열로 바꿈. */
const payFieldSchema = z.union([z.string(), z.number()]);

/**
 * 결제 서버 결제 시작 API 응답. 이니시스 표준결제 폼에 그대로 넣는 값이라
 * 결제에 꼭 필요한 값만 필수로 두고 나머지는 없을 수 있게 둠. `returnUrl`은 서버가 정해 주므로 필수.
 */
export const payResponseSchema = z.object({
  mid: payFieldSchema,
  version: payFieldSchema,
  returnUrl: payFieldSchema,
  closeUrl: payFieldSchema.nullish(),
  signature: payFieldSchema,
  timestamp: payFieldSchema,
  mKey: payFieldSchema,
  oid: payFieldSchema,
  cardQuotaBase: payFieldSchema.nullish(),
  gopaymethod: payFieldSchema.nullish(),
  acceptmethod: payFieldSchema.nullish(),
  merchantData: payFieldSchema.nullish(),
});

export type ChargeInit = z.infer<typeof chargeInitSchema>;
export type PayResponse = z.infer<typeof payResponseSchema>;
