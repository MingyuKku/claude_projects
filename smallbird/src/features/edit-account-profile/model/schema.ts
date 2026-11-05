import { z } from "zod";

/** `GET /v3/mypage/account/profile`. 화면은 이미지 주소만 읽음. */
export const profileImageResponseSchema = z.object({
  profileUrl: z.string().nullish(),
});

/**
 * 광고주 서버 `GET /cert/decrypte`(Swagger `CertDecrypteResponse`). Swagger는 `success`·`fail`만 적었으나
 * v2가 `same`·`exist`(이미 등록된 번호)도 처리해 문자열로 받음(docs/mypage-api.md §4-13 ④).
 */
export const certDecryptSchema = z.object({
  result: z.string(),
  certIdx: z.number().nullish(),
  phoneNumber: z.string().nullish(),
  name: z.string().nullish(),
});
