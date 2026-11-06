import { serverApi } from "@/shared/api";
import { KMC_RESULT_PARAMS } from "@/shared/lib";

import { certDecryptSchema } from "../model/schema";

import type { KmcResult } from "@/shared/lib";

// 마이페이지 휴대폰 변경은 회원가입(member 서버)이 아니라 광고주 서버의 본인인증 경로를 씀. 시작값은 v3 `/auth/cert/init`(공용 `fetchKmcRequestToken`),
// 결과 복호화는 v2 `/cert/decrypte`이고, 여기서 받은 `certIdx`를 `PUT /v3/mypage/account/modify`에 보냄(docs/mypage-api.md §4-13).

export async function decryptCertResult({ recCert, certNum }: KmcResult) {
  const response = await serverApi.get("/cert/decrypte", {
    params: {
      [KMC_RESULT_PARAMS.recCert]: recCert,
      [KMC_RESULT_PARAMS.certNum]: certNum,
    },
  });
  return certDecryptSchema.parse(response);
}
