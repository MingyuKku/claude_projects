import { tryit } from "radash";
import { useRef, useState } from "react";

import { classifyWithdrawError } from "../lib/withdraw-error";
import { requestWithdraw } from "./withdraw-api";

import type { WithdrawFailure } from "../lib/withdraw-error";
import type { WithdrawBody } from "../lib/withdraw-form";
import type { WithdrawResult } from "../model/schema";

export type WithdrawOutcome =
  | { isSuccess: true; result: WithdrawResult }
  | { isSuccess: false; failure: WithdrawFailure };

/** 출금 요청을 보내고 진행 중 여부를 알려 줌. 이미 진행 중이라 무시했으면 null. */
export function useRequestWithdraw() {
  const [isRequesting, setIsRequesting] = useState(false);
  // state는 같은 렌더 안의 연속 제출(Enter 연타)을 못 막아서 ref로도 막음.
  const isInFlightRef = useRef(false);

  async function request(
    body: WithdrawBody,
    bankBook: File,
  ): Promise<WithdrawOutcome | null> {
    if (isInFlightRef.current) return null;
    isInFlightRef.current = true;
    setIsRequesting(true);
    const [error, result] = await tryit(requestWithdraw)(body, bankBook);
    isInFlightRef.current = false;
    setIsRequesting(false);
    if (error) {
      const failure = classifyWithdrawError(error);
      if (failure.kind === "unknown") console.error(error);
      return { isSuccess: false, failure };
    }
    return { isSuccess: true, result };
  }

  return { isRequesting, request };
}
