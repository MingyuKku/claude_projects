import { tryit } from "radash";
import { useRef, useState } from "react";

import { checkAccountValue } from "@/entities/account";

import { isUncheckableId } from "./create-form";

import type { IdCheckStatus } from "./create-form";

/**
 * 아이디 중복확인. 아이디를 고치면 `reset`으로 이전 결과를 무효로 하고, 확인 요청도 비워 고치기 전에 보낸 요청의 응답이
 * 늦게 와도 반영하지 않음(v2는 고쳐도 통과 상태가 남던 버그). 형식이 틀린 아이디는 호출하는 쪽이 먼저 걸러야 함.
 */
export function useIdCheck() {
  const [status, setStatus] = useState<IdCheckStatus>("idle");
  const [isChecking, setIsChecking] = useState(false);
  /** 마지막으로 확인을 요청한 아이디. */
  const requestedIdRef = useRef("");

  function reset() {
    setStatus("idle");
    requestedIdRef.current = "";
  }

  async function check(identifier: string) {
    // 금지어는 서버에 묻지 않고 중복과 같은 문구로 알림(회원가입과 같음).
    if (isUncheckableId(identifier)) {
      setStatus("taken");
      return;
    }
    requestedIdRef.current = identifier;
    setIsChecking(true);
    const [error, result] = await tryit(checkAccountValue)("id", identifier);
    setIsChecking(false);
    if (requestedIdRef.current !== identifier) return;
    if (error) setStatus("error");
    else setStatus(result === "available" ? "available" : "taken");
  }

  return {
    status,
    isChecking,
    reset,
    check,
    markTaken: () => setStatus("taken"),
  };
}
