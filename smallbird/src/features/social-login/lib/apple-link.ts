import { requestAppleIdToken } from "./apple-authorize";

import type { SocialLinkRequest } from "@/entities/account";

/** 애플 팝업에서 ID 토큰을 받아 연결 요청에 넘김. 서버가 서명·`aud`를 확인해 로그인한 Master에 연결함. 팝업을 닫았으면 취소. */
export async function startAppleLink(): Promise<SocialLinkRequest> {
  const token = await requestAppleIdToken();
  return token ? { status: "token", token } : { status: "cancelled" };
}
