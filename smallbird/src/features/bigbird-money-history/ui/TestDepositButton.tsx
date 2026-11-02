import { tryit } from "radash";
import { useState } from "react";
import { toast } from "sonner";

import { readFailureReason } from "@/entities/account";
import { useRefreshBigbirdMoneyBalance } from "@/entities/bigbird-money";
import { Button } from "@/shared/ui/button";

import { requestTestDeposit } from "../api/test-deposit-api";
import { useReloadChargeHistory } from "../api/use-charge-history";

import type { ChargeRecord } from "../model/charge-types";

/** 테스트 API 실패 사유(Swagger). 개발 서버 전용 확인 도구라 문구를 번역하지 않음. */
const FAILURE_MESSAGE: Record<string, string> = {
  ALREADY_DEPOSITED: "이미 입금 완료된 건입니다.",
  NOT_VBANK: "무통장 입금 건이 아닙니다.",
  DEPOSIT_EXPIRED: "입금 기한이 지난 건입니다.",
  HISTORY_NOT_FOUND: "충전 건을 찾을 수 없거나 Stage 환경이 아닙니다.",
  NOTI_FAILED: "결제 서버 입금 통보에 실패했습니다.",
};

interface TestDepositButtonProps {
  record: Pick<ChargeRecord, "serverId">;
}

/**
 * [개발 서버 전용] 대기 중 무통장 입금 충전 건을 입금 완료로 만드는 버튼. 실제 입금이 어려운 테스트 단계용이라
 * `import.meta.env.DEV`에서만 그리고, 처리 뒤 충전/출금 내역과 잔액을 다시 읽음.
 */
export function TestDepositButton({ record }: TestDepositButtonProps) {
  const reloadHistory = useReloadChargeHistory();
  const refreshBalance = useRefreshBigbirdMoneyBalance();
  const [isRequesting, setIsRequesting] = useState(false);

  async function handleClick() {
    setIsRequesting(true);
    const [error] = await tryit(requestTestDeposit)(record.serverId);
    setIsRequesting(false);
    if (error) {
      const reason = readFailureReason(error);
      console.error("[test-deposit] 실패", error);
      toast.error(
        (reason && FAILURE_MESSAGE[reason]) ??
          `테스트 입금 처리에 실패했습니다.${reason ? ` (${reason})` : ""}`,
      );
      return;
    }
    toast.success("테스트 입금 처리했습니다.");
    await Promise.all([reloadHistory(), refreshBalance()]);
  }

  return (
    <Button
      type="button"
      variant="outline-muted"
      className="w-full border-dashed"
      disabled={isRequesting}
      onClick={() => void handleClick()}
    >
      [DEV] 입금 처리(테스트)
    </Button>
  );
}
