import { formatNumber, useTranslation } from "@/shared/i18n";
import { cn } from "@/shared/lib/utils";

import type { ChargeRecord } from "../model/charge-types";

const SIGN_BY_TYPE = { charge: "+", withdraw: "-" } as const;

interface ChargeAmountProps {
  record: Pick<ChargeRecord, "type" | "amount">;
  className?: string;
}

// 목록 금액(시안): 충전 "+{n}원" 파랑 w600(0원도 "+0원"), 출금 "-{n}원" 검정 w600. 서버 금액은 부호 없는 양수.
// 모르는 구분은 부호 없이, 값이 없으면 아무것도 그리지 않음.
export function ChargeAmount({ record, className }: ChargeAmountProps) {
  const { t } = useTranslation("features/bigbird-money-history");
  const { type, amount } = record;

  if (amount === null) return null;
  const sign = type ? SIGN_BY_TYPE[type] : "";
  return (
    <span
      className={cn(
        "font-semibold",
        type === "charge" && "text-primary",
        className,
      )}
    >
      {t("won", { amount: `${sign}${formatNumber(amount)}` })}
    </span>
  );
}
