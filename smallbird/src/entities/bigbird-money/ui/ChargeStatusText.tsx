import { useTranslation } from "@/shared/i18n";

import type { ChargeStatus } from "../model/charge-status";

interface ChargeStatusTextProps {
  /** 서버 입금 상태 값. 모르는 값이면 서버 값을 그대로 보임. */
  serverValue: string;
  status: ChargeStatus | null;
}

// 입금 상태는 배지가 아니라 글자로 보임(3.0.8 결정). 배지는 "구분" 열에만 씀.
export function ChargeStatusText({
  serverValue,
  status,
}: ChargeStatusTextProps) {
  const { t } = useTranslation("entities/bigbird-money");

  return <span>{status ? t(`chargeStatus.${status}`) : serverValue}</span>;
}
