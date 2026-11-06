import { useEffect, useEffectEvent } from "react";
import { z } from "zod";

import { serverApiV3 } from "@/shared/api";
import { ROUTES } from "@/shared/config";

// KMC(한국모바일인증) 휴대폰 본인인증 공통 처리. 서버(`/v3/auth/cert/init`)가 준 암호화 값을 KMC로 POST하면, 인증 뒤 KMC가
// 창을 `trUrl`(우리 `/cert/success`)로 보내며 `rec_cert`·`certNum`을 쿼리로 붙임. 이를 복호화하는 API는 쓰는 쪽이 고름
// (회원가입은 member 서버, 마이페이지는 광고주 서버).

export const KMC_CERT_URL = "https://www.kmcert.com/kmcis/web/kmcisReq.jsp";
const KMC_POPUP_NAME = "KMCISWindow";
const KMC_POPUP_FEATURES =
  "width=396, height=643, resizable=0, scrollbars=no, status=0, titlebar=0, toolbar=0, left=435, top=250";
/** 모바일 페이지 이동 뒤 `/cert/success`가 돌아갈 주소. 다른 탭과 섞이지 않게 sessionStorage에 둠. */
const RETURN_PATH_STORAGE_KEY = "kmc-return-path";

/** KMC가 결과 주소에 붙이는 쿼리 이름. */
export const KMC_RESULT_PARAMS = {
  recCert: "rec_cert",
  certNum: "certNum",
} as const;

/** `/v3/auth/cert/init` 응답(Swagger `CertInitV3Response`). 이름은 KMC 계약. */
const kmcRequestTokenSchema = z.object({
  trCert: z.string(),
  trUrl: z.string(),
  trAdd: z.string(),
});
export type KmcRequestToken = z.infer<typeof kmcRequestTokenSchema>;

/**
 * 본인인증 시작값. 인증 뒤 KMC가 결과를 보낼 주소(`trUrl`)로 현재 출처의 결과 페이지를 보내,
 * 서버 고정 주소(다른 도메인)로 가서 KMC가 요청을 거부(7-3)하지 않게 함. 회원가입·마이페이지가 함께 씀.
 */
export async function fetchKmcRequestToken() {
  const response = await serverApiV3.get("/auth/cert/init", {
    params: { trUrl: `${window.location.origin}${ROUTES.certSuccess}` },
  });
  return kmcRequestTokenSchema.parse(response);
}

export interface KmcResult {
  recCert: string;
  certNum: string;
}

declare global {
  interface Window {
    /** KMC 계약: 결과 페이지가 오프너의 이 함수를 부름(키 이름은 KMC 것). */
    cert_result?: (data: { rec_cert: string; certNum: string }) => void;
  }
}

/** KMC는 GET을 받지 않아 숨은 form을 POST함. `target`은 팝업 이름 또는 `_self`. */
function submitKmcRequest(token: KmcRequestToken, target: string) {
  const form = document.createElement("form");
  form.method = "post";
  form.action = KMC_CERT_URL;
  form.target = target;
  const fields: [string, string][] = [
    ["tr_cert", token.trCert],
    ["tr_url", token.trUrl],
    ["tr_add", token.trAdd],
  ];
  for (const [name, value] of fields) {
    const input = document.createElement("input");
    input.type = "hidden";
    input.name = name;
    input.value = value;
    form.appendChild(input);
  }
  document.body.appendChild(form);
  form.submit();
  form.remove();
}

/** PC: 팝업으로 엶. 브라우저가 팝업을 막으면 false. */
export function openKmcPopup(token: KmcRequestToken) {
  const popup = window.open("", KMC_POPUP_NAME, KMC_POPUP_FEATURES);
  if (!popup) return false;
  submitKmcRequest(token, KMC_POPUP_NAME);
  return true;
}

/**
 * 모바일: 팝업이 막히거나 새 탭으로 열려 오프너 콜백이 끊기므로 현재 창을 KMC로 보냄(업계 표준).
 * 돌아오면 `/cert/success`가 `returnPath`에 결과 쿼리를 붙여 다시 보냄.
 */
export function redirectToKmc(token: KmcRequestToken, returnPath: string) {
  try {
    sessionStorage.setItem(RETURN_PATH_STORAGE_KEY, returnPath);
  } catch {
    // 저장이 막힌 브라우저는 돌아올 곳이 없어 결과 페이지가 홈으로 보냄.
  }
  submitKmcRequest(token, "_self");
}

/** 모바일 이동 전에 저장한 복귀 주소를 꺼내고 지움. 없으면 null. */
export function takeKmcReturnPath() {
  try {
    const path = sessionStorage.getItem(RETURN_PATH_STORAGE_KEY);
    sessionStorage.removeItem(RETURN_PATH_STORAGE_KEY);
    return path;
  } catch {
    return null;
  }
}

/** 팝업 결과를 받을 오프너 콜백을 등록하고, 화면을 떠나면 지움. */
export function useKmcPopupResult(onResult: (result: KmcResult) => void) {
  const handleResult = useEffectEvent(onResult);

  useEffect(() => {
    window.cert_result = (data) =>
      handleResult({ recCert: data.rec_cert, certNum: data.certNum });
    return () => {
      delete window.cert_result;
    };
  }, []);
}
