import { useId } from "react";

import { cn } from "@/shared/lib/utils";
import { Label } from "@/shared/ui/label";

import type { ComponentProps, ReactNode } from "react";

// Figma Text Field / Price(6958:57035). 라벨(semibold) + 단위가 붙은 40px 필드 + 선택 버튼.
// 포커스 링은 입력이 아니라 필드 테두리에 그림.
interface PriceFieldProps extends Omit<ComponentProps<"input">, "children"> {
  label?: string;
  unit: string;
  action?: ReactNode;
}

export function PriceField({
  label,
  unit,
  action,
  id,
  disabled,
  className,
  ...props
}: PriceFieldProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;

  return (
    <div
      className={cn(
        "flex w-full flex-col gap-2",
        disabled && "opacity-50",
        className,
      )}
    >
      {label && (
        <Label htmlFor={inputId} className="font-semibold">
          {label}
        </Label>
      )}
      <div className="flex items-center gap-2">
        <div className="flex h-10 min-w-0 flex-1 items-center rounded-md border border-input bg-background px-3 py-2 has-focus-visible:ring-2 has-focus-visible:ring-primary has-focus-visible:ring-offset-2">
          <input
            inputMode="numeric"
            {...props}
            id={inputId}
            disabled={disabled}
            className="min-w-0 flex-1 bg-transparent text-sm leading-5 text-foreground outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed supports-[-webkit-touch-callout:none]:text-base"
          />
          <span className="shrink-0 pl-4 text-sm leading-5 text-foreground">
            {unit}
          </span>
        </div>
        {action}
      </div>
    </div>
  );
}
