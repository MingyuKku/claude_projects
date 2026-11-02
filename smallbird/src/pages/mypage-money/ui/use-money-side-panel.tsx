import {
  ChargeDetail,
  UsageDetail,
  useChargeRecord,
  useUsageRecord,
} from "@/features/bigbird-money-history";
import { ChargePanel } from "@/features/charge-bigbird-money";
import { WithdrawPanel } from "@/features/withdraw-bigbird-money";

import type { MoneyPanel } from "../model/tabs";
import type { WithdrawResult } from "@/features/withdraw-bigbird-money";

interface UseMoneySidePanelOptions {
  panel: MoneyPanel | null;
  /** 상세로 연 내역(쿼리 `id`). */
  activeId: string | null;
  /** TAB·MO는 제목 앞에 뒤로 버튼도 둠(시안). */
  hasBackButton: boolean;
  onClose: () => void;
  onWithdrawn: (result: WithdrawResult) => void;
}

// 열린 하위 화면(충전·출금·거래 상세·사용 상세)의 내용. 상세는 내역을 찾기 전(불러오는 중·없는 id)에는 null이라 패널을 열지 않음.
export function useMoneySidePanel({
  panel,
  activeId,
  hasBackButton,
  onClose,
  onWithdrawn,
}: UseMoneySidePanelOptions) {
  const chargeRecord = useChargeRecord(
    panel === "charge-detail" ? activeId : null,
  );
  const usageRecord = useUsageRecord(
    panel === "usage-detail" ? activeId : null,
  );

  if (panel === "charge") {
    return <ChargePanel onClose={onClose} hasBackButton={hasBackButton} />;
  }
  if (panel === "withdraw") {
    return (
      <WithdrawPanel
        onClose={onClose}
        hasBackButton={hasBackButton}
        onWithdrawn={onWithdrawn}
      />
    );
  }
  if (panel === "charge-detail" && chargeRecord) {
    return (
      <ChargeDetail
        record={chargeRecord}
        onClose={onClose}
        hasBackButton={hasBackButton}
      />
    );
  }
  if (panel === "usage-detail" && usageRecord) {
    return (
      <UsageDetail
        record={usageRecord}
        onClose={onClose}
        hasBackButton={hasBackButton}
      />
    );
  }
  return null;
}
