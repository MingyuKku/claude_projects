import { tryit } from "radash";
import { useRef, useState } from "react";

import { requestCharge } from "./charge-request-api";

/**
 * 충전 요청을 보내고 진행 중 여부를 알려 줌. 결제창이 뜨면 true, 어느 단계든 실패하면 false(알림은 호출하는 쪽이 띄움),
 * 이미 진행 중이라 무시했으면 null.
 */
export function useRequestCharge() {
  const [isRequesting, setIsRequesting] = useState(false);
  // state는 같은 렌더 안의 연속 제출(Enter 연타)을 못 막아서 ref로도 막음.
  const isInFlightRef = useRef(false);

  async function request(amount: number, returnPath?: string) {
    if (isInFlightRef.current) return null;
    isInFlightRef.current = true;
    setIsRequesting(true);
    const [error] = await tryit(requestCharge)(amount, returnPath);
    isInFlightRef.current = false;
    setIsRequesting(false);
    if (error) {
      console.error(error);
      return false;
    }
    return true;
  }

  return { isRequesting, request };
}
