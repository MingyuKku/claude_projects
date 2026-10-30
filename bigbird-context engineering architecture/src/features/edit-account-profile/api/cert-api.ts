import { serverApi, serverApiV3 } from "@/shared/api";
import { ROUTES } from "@/shared/config";
import { KMC_RESULT_PARAMS } from "@/shared/lib";

import { certDecryptSchema, certTokenSchema } from "../model/schema";

import type { KmcResult } from "@/shared/lib";

// 마이페이지 휴대폰 변경은 회원가입(member 서버)이 아니라 광고주 서버의 본인인증 경로를 씀. 시작값은 v3 `/mypage/cert/init`,
// 결과 복호화는 v2 `/cert/decrypte`이고, 여기서 받은 `certIdx`를 `PUT /v3/mypage/account/modify`에 보냄(docs/mypage-api.md §4-13).

/** 인증 뒤 KMC가 결과를 보낼 주소(`trUrl`)로 현재 출처의 결과 페이지를 보내 v2 주소로 가지 않게 함. */
export async function fetchCertToken() {
  const response = await serverApiV3.get("/mypage/cert/init", {
    params: { trUrl: `${window.location.origin}${ROUTES.certSuccess}` },
  });
  return certTokenSchema.parse(response);
}

export async function decryptCertResult({ recCert, certNum }: KmcResult) {
  const response = await serverApi.get("/cert/decrypte", {
    params: {
      [KMC_RESULT_PARAMS.recCert]: recCert,
      [KMC_RESULT_PARAMS.certNum]: certNum,
    },
  });
  return certDecryptSchema.parse(response);
}
