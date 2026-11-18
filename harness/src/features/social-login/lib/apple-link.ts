import { requestAppleCode } from "./apple-authorize";

import type { SocialLinkRequest } from "@/entities/account";

/** 애플 팝업에서 인가 코드를 받아 연결 요청에 넘김. 서버가 코드를 교환해 로그인한 Master에 연결함. 팝업을 닫았으면 취소. */
export async function startAppleLink(): Promise<SocialLinkRequest> {
  const apple = await requestAppleCode();
  return apple ? { status: "code", ...apple } : { status: "cancelled" };
}
