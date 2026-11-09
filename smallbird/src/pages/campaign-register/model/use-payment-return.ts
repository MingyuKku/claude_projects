import { useEffect, useState } from "react";
import { useSearchParams } from "react-router";

import { useRefreshBigbirdMoneyBalance } from "@/entities/bigbird-money";
import {
  PAYMENT_RETURN_PARAM,
  PAYMENT_RETURN_SUCCESS,
} from "@/features/charge-bigbird-money";

/**
 * 결제창에서 돌아왔을 때(결제 서버가 `redirectUri` 뒤에 붙이는 `?isPaid=…`)의 처리. 접수 알럿 여부는 첫 렌더의 쿼리로 정하고(주소는 곧 바뀜),
 * 돌아온 것이면 잔액을 다시 읽음. 주소를 8단계로 바꾸고 결제 서버가 붙인 쿼리를 지우는 일은 페이지가 `isReturned`로 함.
 * 마이페이지 `usePaymentReturn`과 같은 규칙이고, 실패·취소(`isPaid=false`)는 알림 없이 일반 방문처럼 8단계만 엶.
 */
export function usePaymentReturn() {
  const [searchParams] = useSearchParams();
  const [isRequested, setIsRequested] = useState(
    () => searchParams.get(PAYMENT_RETURN_PARAM) === PAYMENT_RETURN_SUCCESS,
  );
  const isReturned = searchParams.has(PAYMENT_RETURN_PARAM);
  const refreshBalance = useRefreshBigbirdMoneyBalance();

  useEffect(() => {
    if (!isReturned) return;
    // 재조회에 실패하면 결제 수단 카드가 잔액을 "—"로 보임.
    void refreshBalance().catch(() => undefined);
  }, [isReturned, refreshBalance]);

  return { isReturned, isRequested, closeAlert: () => setIsRequested(false) };
}
