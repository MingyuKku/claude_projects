import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router";

import { PAYMENT_RETURN_PARAM, PAYMENT_RETURN_SUCCESS } from "./constants";

interface UsePaymentReturnOptions {
  /** 결제창에서 돌아왔을 때(성공·실패 모두) 다시 읽을 것(잔액·충전 내역 등). 실패는 쓰는 화면이 자체 오류로 보여 줌. */
  onReturned: () => Promise<unknown>;
  /** 결제 서버가 붙인 쿼리를 지운 뒤 남길 쿼리. 없으면 모두 지움(예: 캠페인 등록은 결제 단계 `step=payment`를 남김). */
  nextSearchParams?: Record<string, string>;
}

/**
 * 결제창에서 돌아왔을 때(결제 서버가 붙이는 `?isPaid=true`) 알럿을 띄우고, 결제 서버가 붙인 쿼리(실패·취소의 `isPaid=false&code=…` 포함)를 지우고
 * `onReturned`로 다시 읽음. 결제 서버가 도메인을 붙여 전체 주소로 돌려보내므로 알럿 여부는 첫 렌더의 쿼리로 정함.
 * `redirectUri`를 쿼리 없이 보내므로 복귀 주소의 쿼리는 모두 결제 서버가 붙인 것이라 통째로 지움. 이름을 골라 지우면
 * 서버가 새로 붙이는 값(가상계좌 번호·입금기한 등)이 주소에 남음.
 */
export function usePaymentReturn({
  onReturned,
  nextSearchParams,
}: UsePaymentReturnOptions) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [isRequested, setIsRequested] = useState(
    () => searchParams.get(PAYMENT_RETURN_PARAM) === PAYMENT_RETURN_SUCCESS,
  );
  const isReturned = searchParams.has(PAYMENT_RETURN_PARAM);
  const isHandledRef = useRef(false);
  // 효과는 복귀 때 한 번만 돌므로 첫 렌더의 값을 씀.
  const optionsRef = useRef({ onReturned, nextSearchParams });

  useEffect(() => {
    if (!isReturned || isHandledRef.current) return;
    isHandledRef.current = true;
    const { onReturned: reload, nextSearchParams: next } = optionsRef.current;
    setSearchParams(new URLSearchParams(next), { replace: true });
    void reload().catch(() => undefined);
  }, [isReturned, setSearchParams]);

  return {
    isRequested,
    /** 결제 서버가 붙인 쿼리가 아직 주소에 있음. 주소를 고쳐 쓰는 화면은 지워질 때까지 기다림. */
    isClearingQuery: isReturned,
    closeAlert: () => setIsRequested(false),
  };
}
