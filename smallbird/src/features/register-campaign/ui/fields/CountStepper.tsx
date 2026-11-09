import { Minus, Plus } from "lucide-react";
import { useId } from "react";

import { formatNumber } from "@/shared/i18n";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import { Label } from "@/shared/ui/label";

interface CountStepperProps {
  label: string;
  isRequired?: boolean;
  unit: string;
  /** 비어 있으면 0으로 보임. 0으로 내리면 비움(null)으로 돌려 단계 검사가 입력 없음으로 봄. */
  value: number | null;
  onChangeValue: (value: number | null) => void;
  decreaseLabel: string;
  increaseLabel: string;
  className?: string;
}

// 숫자 스테퍼(Figma "− 0 명 +"): 가운데는 값과 단위를 보이는 칸이고 양쪽 버튼으로 1씩 바꿈. 상한은 없음(스펙: 제한 없음).
export function CountStepper({
  label,
  isRequired,
  unit,
  value,
  onChangeValue,
  decreaseLabel,
  increaseLabel,
  className,
}: CountStepperProps) {
  const labelId = useId();
  const count = value ?? 0;

  return (
    <div
      role="group"
      aria-labelledby={labelId}
      className={cn("flex w-full flex-col gap-2", className)}
    >
      <Label id={labelId} className="gap-0.5">
        {label}
        {isRequired && (
          <span aria-hidden="true" className="font-semibold text-primary">
            *
          </span>
        )}
      </Label>
      <div className="flex w-fit items-center rounded-lg border bg-background p-1">
        <Button
          type="button"
          variant="outline"
          size="icon-xs"
          aria-label={decreaseLabel}
          disabled={count <= 0}
          onClick={() => onChangeValue(count <= 1 ? null : count - 1)}
        >
          <Minus aria-hidden />
        </Button>
        <output className="flex w-21.5 items-center justify-center gap-1 text-sm leading-5">
          <span className="font-medium">{formatNumber(count)}</span>
          <span className="text-muted-foreground">{unit}</span>
        </output>
        <Button
          type="button"
          variant="outline"
          size="icon-xs"
          aria-label={increaseLabel}
          onClick={() => onChangeValue(count + 1)}
        >
          <Plus aria-hidden />
        </Button>
      </div>
    </div>
  );
}
