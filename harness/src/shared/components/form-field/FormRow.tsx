import { useId } from "react";

import { cn } from "@/shared/lib/utils";
import { Label } from "@/shared/ui/label";

import type { FormFieldControlProps } from "./FormField";
import type { ReactNode } from "react";

export interface FormRowControlProps extends FormFieldControlProps {
  "aria-labelledby": string;
}

// Figma 마이페이지 폼 Table Row(6925:50150 계열): 태블릿 이상은 라벨 칸과 입력 칸이 1:1인 표(칸 좌우 16px, 행 최소 48px),
// 모바일은 라벨 위·입력 아래. 오류 문구는 입력 칸 아래에 둠.
interface FormRowProps {
  label: string;
  isRequired?: boolean;
  errorText?: string;
  helpText?: string;
  className?: string;
  children: (control: FormRowControlProps) => ReactNode;
}

export function FormRow({
  label,
  isRequired = false,
  errorText,
  helpText,
  className,
  children,
}: FormRowProps) {
  const id = useId();
  const labelId = `${id}-label`;
  const helpId = `${id}-help`;
  const errorId = `${id}-error`;
  const describedBy =
    [helpText && helpId, errorText && errorId].filter(Boolean).join(" ") ||
    undefined;

  const control = children({
    id,
    "aria-labelledby": labelId,
    "aria-describedby": describedBy,
    "aria-invalid": errorText ? true : undefined,
  });

  return (
    <div
      className={cn(
        "grid w-full grid-cols-1 gap-2 tablet:min-h-12 tablet:grid-cols-2 tablet:items-start tablet:gap-0",
        className,
      )}
    >
      {/* 입력 칸 밖(라벨 칸 여백 포함)을 눌러 포커스가 옮겨지지 않게 htmlFor 없이 aria-labelledby로만 잇는다. */}
      <Label
        id={labelId}
        className="gap-0.5 font-medium tablet:min-h-12 tablet:px-4 tablet:font-semibold"
      >
        {label}
        {isRequired && (
          <span aria-hidden="true" className="font-semibold text-primary">
            *
          </span>
        )}
      </Label>
      <div className="flex min-w-0 flex-col gap-2 tablet:px-4 tablet:py-1">
        {control}
        {helpText && (
          <p id={helpId} className="text-sm leading-5 text-muted-foreground">
            {helpText}
          </p>
        )}
        {errorText && (
          <p
            id={errorId}
            role="alert"
            className="text-sm leading-5 font-medium text-destructive"
          >
            {errorText}
          </p>
        )}
      </div>
    </div>
  );
}
