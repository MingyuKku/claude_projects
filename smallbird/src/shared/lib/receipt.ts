/**
 * 서버가 준 거래명세서 주소가 열어도 되는 주소인지. 서버 값을 그대로 새 창에 열기 때문에
 * `javascript:` 같은 스킴은 막고 https만 허용함(이니시스 명세서는 https).
 */
export function toReceiptUrl(value: string | null | undefined) {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}

/** 거래명세서(이니시스 호스팅 페이지)를 새 창으로 엶. */
export function openReceipt(url: string) {
  window.open(url, "_blank", "noopener,noreferrer");
}
