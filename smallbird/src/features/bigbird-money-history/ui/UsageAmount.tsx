import { cn } from "@/shared/lib/utils";

import { useMoneyFormat } from "../lib/use-money-format";

interface UsageAmountProps {
  amount: number | null;
  className?: string;
}

// 사용 금액은 w600. 차감(음수)은 검정 "-{n}원", 환급(양수)은 파랑 "+{n}원"(스펙 §3). 값이 없으면 "-"를 기본색으로 보임.
export function UsageAmount({ amount, className }: UsageAmountProps) {
  const { formatSignedWon } = useMoneyFormat();

  return (
    <span
      className={cn(
        amount !== null && "font-semibold",
        amount !== null && amount > 0 && "text-primary",
        className,
      )}
    >
      {formatSignedWon(amount)}
    </span>
  );
}
