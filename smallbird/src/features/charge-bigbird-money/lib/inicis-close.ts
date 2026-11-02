// 이니시스 표준결제 스크립트가 올라오는 호스트(테스트·운영). 이 밖의 주소는 닫기 스크립트로 불러오지 않음.
const INICIS_SCRIPT_HOSTS: ReadonlySet<string> = new Set([
  "stdpay.inicis.com",
  "stgstdpay.inicis.com",
]);
const STD_SCRIPT_FILE = "INIStdPay.js";
const CLOSE_SCRIPT_FILE = "INIStdPay_close.js";

/**
 * 표준결제 스크립트 주소(`VITE_INICIS_STDPAY_URL`)에서 같은 호스트의 닫기 스크립트 주소를 만듦.
 * 허용한 이니시스 호스트의 https 주소가 아니거나 표준결제 스크립트 파일명이 아니면 null.
 * 닫기 스크립트는 공식 문서에 안내가 없고 같은 회사 다른 프로젝트(biglinkcre-client-fe)의 닫기 페이지에서 쓰는 방식을 따름.
 */
export function buildInicisCloseScriptUrl(stdPayUrl: string | undefined) {
  if (!stdPayUrl) return null;
  try {
    const url = new URL(stdPayUrl);
    if (url.protocol !== "https:") return null;
    if (!INICIS_SCRIPT_HOSTS.has(url.hostname)) return null;
    if (!url.pathname.endsWith(`/${STD_SCRIPT_FILE}`)) return null;
    url.pathname = url.pathname.replace(
      new RegExp(`${STD_SCRIPT_FILE}$`),
      CLOSE_SCRIPT_FILE,
    );
    url.search = "";
    url.hash = "";
    return url.href;
  } catch {
    return null;
  }
}
