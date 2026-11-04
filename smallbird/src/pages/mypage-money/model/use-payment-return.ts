import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router";

import { useRefreshBigbirdMoneyBalance } from "@/entities/bigbird-money";
import { useReloadChargeHistory } from "@/features/bigbird-money-history";
import {
  PAYMENT_RETURN_PARAM,
  PAYMENT_RETURN_SUCCESS,
} from "@/features/charge-bigbird-money";

/**
 * 결제창에서 돌아왔을 때(결제 서버가 붙이는 `?isPaid=true`) 알럿을 띄우고, 결제 서버가 붙인 쿼리(실패·취소의 `isPaid=false&code=…` 포함)를 지우고
 * 잔액·충전 내역을 다시 읽음. 결제 서버가 도메인을 붙여 전체 주소로 돌려보내므로 알럿 여부는 첫 렌더의 쿼리로 정함.
 * `redirectUri`를 쿼리 없이 보내므로 복귀 주소의 쿼리는 모두 결제 서버가 붙인 것이라 통째로 지움. 이름을 골라 지우면
 * 서버가 새로 붙이는 값(가상계좌 번호·입금기한 등)이 주소에 남음(QA-21-DEV-002).
 */
export function usePaymentReturn() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [isRequested, setIsRequested] = useState(
    () => searchParams.get(PAYMENT_RETURN_PARAM) === PAYMENT_RETURN_SUCCESS,
  );
  const isReturned = searchParams.has(PAYMENT_RETURN_PARAM);
  const reloadHistory = useReloadChargeHistory();
  const refreshBalance = useRefreshBigbirdMoneyBalance();
  const isHandledRef = useRef(false);

  useEffect(() => {
    if (!isReturned || isHandledRef.current) return;
    isHandledRef.current = true;
    setSearchParams(new URLSearchParams(), { replace: true });
    // 재조회에 실패하면 내역 목록이 자체 오류 상태를 보여 줌.
    void Promise.all([reloadHistory(), refreshBalance()]).catch(
      () => undefined,
    );
  }, [isReturned, reloadHistory, refreshBalance, setSearchParams]);

  return { isRequested, closeAlert: () => setIsRequested(false) };
}
