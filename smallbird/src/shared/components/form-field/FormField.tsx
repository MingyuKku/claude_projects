import { useId } from "react";

import { cn } from "@/shared/lib/utils";
import { Label } from "@/shared/ui/label";

import type { ReactNode } from "react";

// Figma 디자인 시스템 Input·Combobox의 라벨/필수(*)/카운터/도움말/오류 문구 영역.
// 입력 요소는 children 렌더 함수로 받아 id·aria 속성을 연결함.
export interface FormFieldControlProps {
  id: string;
  "aria-describedby"?: string;
  "aria-invalid"?: true;
  disabled?: boolean;
}

interface FormFieldProps {
  label?: string;
  isRequired?: boolean;
  counter?: string;
  helpText?: string;
  errorText?: string;
  orientation?: "vertical" | "horizontal";
  disabled?: boolean;
  className?: string;
  children: (control: FormFieldControlProps) => ReactNode;
}

export function FormField({
  label,
  isRequired = false,
  counter,
  helpText,
  errorText,
  orientation = "vertical",
  disabled,
  className,
  children,
}: FormFieldProps) {
  const id = useId();
  const helpId = `${id}-help`;
  const errorId = `${id}-error`;
  const describedBy =
    [helpText && helpId, errorText && errorId].filter(Boolean).join(" ") ||
    undefined;
  const isHorizontal = orientation === "horizontal";

  const control = children({
    id,
    "aria-describedby": describedBy,
    "aria-invalid": errorText ? true : undefined,
    disabled,
  });

  const messages = (
    <>
      {helpText && (
        <p id={helpId} className="text-sm leading-5 text-muted-foreground">
          {helpText}
        </p>
      )}
      {errorText && (
        <p
          id={errorId}
          className="text-sm leading-5 font-medium text-destructive"
        >
          {errorText}
        </p>
      )}
    </>
  );

  const labelNode = label && (
    <Label
      htmlFor={id}
      className={cn("gap-0.5", isHorizontal && "justify-end text-right")}
    >
      {label}
      {isRequired && (
        <span aria-hidden="true" className="font-semibold text-primary">
          *
        </span>
      )}
    </Label>
  );

  if (isHorizontal) {
    return (
      <div
        className={cn(
          "grid w-full grid-cols-[1fr_2fr] items-center gap-x-4 gap-y-2",
          disabled && "opacity-50",
          className,
        )}
      >
        {labelNode ?? <span />}
        {control}
        {(helpText || errorText) && (
          <div className="col-start-2 flex flex-col gap-2">{messages}</div>
        )}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex w-full flex-col gap-2",
        disabled && "opacity-50",
        className,
      )}
    >
      {(labelNode || counter) && (
        <div className="flex items-start gap-2">
          <div className="flex min-w-0 flex-1 items-center">{labelNode}</div>
          {counter && (
            <span className="text-sm leading-5 text-foreground">{counter}</span>
          )}
        </div>
      )}
      {control}
      {messages}
    </div>
  );
}
