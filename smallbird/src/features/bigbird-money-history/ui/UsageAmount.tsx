import { cn } from "@/shared/lib/utils";

import { useMoneyFormat } from "../lib/use-money-format";

interface UsageAmountProps {
  amount: number | null;
  className?: string;
}

// 차감(음수)은 모든 기기에서 빨강, 반환(양수)은 초록, 값이 없거나 0이면 기본색(스펙 §3).
export function UsageAmount({ amount, className }: UsageAmountProps) {
  const { formatSignedWon } = useMoneyFormat();

  return (
    <span
      className={cn(
        amount !== null && amount < 0 && "text-destructive",
        amount !== null && amount > 0 && "text-success",
        className,
      )}
    >
      {formatSignedWon(amount)}
    </span>
  );
}
