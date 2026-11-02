import { useState } from "react";

import { useRefreshBigbirdMoneyBalance } from "@/entities/bigbird-money";
import { useReloadChargeHistory } from "@/features/bigbird-money-history";

import type { WithdrawResult } from "@/features/withdraw-bigbird-money";

/**
 * 출금 요청이 접수되면 완료 알럿을 띄우고 잔액·충전/출금 내역을 다시 읽음.
 * 알럿이 닫히는 동안에도 일시가 비지 않게 접수 일시는 닫은 뒤에도 남겨 둠.
 */
export function useWithdrawnAlert() {
  const [isOpen, setIsOpen] = useState(false);
  const [requestedAt, setRequestedAt] = useState<Date | null>(null);
  const reloadHistory = useReloadChargeHistory();
  const refreshBalance = useRefreshBigbirdMoneyBalance();

  function handleWithdrawn(result: WithdrawResult) {
    setRequestedAt(result.requestedAt);
    setIsOpen(true);
    // 재조회에 실패하면 내역 목록이 자체 오류 상태를 보여 줌.
    void Promise.all([reloadHistory(), refreshBalance()]).catch(
      () => undefined,
    );
  }

  return {
    isOpen,
    requestedAt,
    onWithdrawn: handleWithdrawn,
    closeAlert: () => setIsOpen(false),
  };
}
