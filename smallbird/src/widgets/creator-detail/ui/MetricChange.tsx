import { formatNumber } from "@/shared/i18n";
import { cn } from "@/shared/lib";

/** 전월 대비 증감률. 감소만 색이 다름. */
export function MetricChange({ value }: { value: number }) {
  return (
    <span className={cn(value < 0 && "text-destructive")}>
      {formatNumber(value, { signDisplay: "exceptZero" })}%
    </span>
  );
}
