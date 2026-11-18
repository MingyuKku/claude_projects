import { serverApiV3 } from "@/shared/api";

import { transformWithdraw } from "../lib/transform-withdraw";
import { withdrawResponseSchema } from "../model/schema";

import type { WithdrawBody } from "../lib/withdraw-form";

/**
 * `POST /v3/mypage/bigbird-money/withdraw`. multipart 요청이라 입력값은 JSON 파트(`request`),
 * 통장 사본은 파일 파트(`bankBook`)로 보냄. 실패하면 `ApiError`를 던지고 `reason`은 `readFailureReason`으로 읽음.
 */
export async function requestWithdraw(body: WithdrawBody, bankBook: File) {
  const form = new FormData();
  form.append(
    "request",
    new Blob([JSON.stringify(body)], { type: "application/json" }),
  );
  form.append("bankBook", bankBook);
  const response = await serverApiV3.post(
    "/mypage/bigbird-money/withdraw",
    form,
  );
  return transformWithdraw(withdrawResponseSchema.parse(response));
}
