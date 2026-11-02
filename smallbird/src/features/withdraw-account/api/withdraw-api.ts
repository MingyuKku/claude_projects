import { serverApiV3 } from "@/shared/api";

/** 탈퇴 처리(`PUT /v3/mypage/account/exit`). 응답은 `{result, message}`이고 `result: true`가 성공. */
export function exitAccount() {
  return serverApiV3.put("/mypage/account/exit");
}
