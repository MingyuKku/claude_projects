import type { CertMessage } from "../model/use-cert-flow";

/** 안내 문구의 톤을 입력 아래 지원 문구 상태로 바꿈. 긍정은 통과(pass), 부정은 오류(error). */
export function toSupportState(tone: CertMessage["tone"]) {
  return tone === "positive" ? "pass" : "error";
}
