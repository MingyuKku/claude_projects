import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router";

import { useRefreshBigbirdMoneyBalance } from "@/entities/bigbird-money";
import { useChargeHistory } from "@/features/bigbird-money-history";
import {
  PAYMENT_RETURN_EXTRA_PARAMS,
  PAYMENT_RETURN_PARAM,
  PAYMENT_RETURN_SUCCESS,
} from "@/features/charge-bigbird-money";

/**
 * 결제창에서 돌아왔을 때(결제 서버가 붙이는 `?isPaid=true`) 알럿을 띄우고, 결제 서버가 붙인 쿼리를 지우고
 * 잔액·충전 내역을 다시 읽음. 결제 서버가 도메인을 붙여 전체 주소로 돌려보내므로 알럿 여부는 첫 렌더의 쿼리로 정함.
 */
export function usePaymentReturn() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [isRequested, setIsRequested] = useState(
    () => searchParams.get(PAYMENT_RETURN_PARAM) === PAYMENT_RETURN_SUCCESS,
  );
  const isReturned = searchParams.has(PAYMENT_RETURN_PARAM);
  const { mutate: reloadFirstPage } = useChargeHistory(1);
  const refreshBalance = useRefreshBigbirdMoneyBalance();
  const isHandledRef = useRef(false);

  useEffect(() => {
    if (!isReturned || isHandledRef.current) return;
    isHandledRef.current = true;
    setSearchParams(
      (prev) => {
        const params = new URLSearchParams(prev);
        params.delete(PAYMENT_RETURN_PARAM);
        for (const param of PAYMENT_RETURN_EXTRA_PARAMS) params.delete(param);
        return params;
      },
      { replace: true },
    );
    // 재조회에 실패하면 내역 목록이 자체 오류 상태를 보여 줌.
    void Promise.all([reloadFirstPage(), refreshBalance()]).catch(
      () => undefined,
    );
  }, [isReturned, reloadFirstPage, refreshBalance, setSearchParams]);

  return { isRequested, closeAlert: () => setIsRequested(false) };
}
