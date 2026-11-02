import { useId } from "react";

import { cn } from "@/shared/lib/utils";

import type { ReactNode } from "react";

// Figma 디자인 시스템 Radio Group(6922:37592): 제목·설명 → 옵션 목록(위 8px) → 오류 문구.
interface RadioFieldProps {
  title?: string;
  description?: string;
  errorText?: string;
  disabled?: boolean;
  className?: string;
  children: ReactNode;
}

export function RadioField({
  title,
  description,
  errorText,
  disabled,
  className,
  children,
}: RadioFieldProps) {
  const id = useId();
  const titleId = `${id}-title`;
  const descriptionId = `${id}-description`;
  const errorId = `${id}-error`;
  const describedBy = [description && descriptionId, errorText && errorId]
    .filter(Boolean)
    .join(" ");

  // legend 는 fieldset 의 직계 자식이면 테두리 자리에 따로 배치돼 제목·설명 간격이 깨지므로,
  // 레이아웃은 그대로 두고 aria-labelledby 로 그룹 이름을 연결함.
  return (
    <fieldset
      disabled={disabled}
      aria-labelledby={title ? titleId : undefined}
      aria-describedby={describedBy || undefined}
      className={cn(
        "flex w-full flex-col gap-2",
        disabled &&
          "opacity-50 [&_[data-slot=radio-group-item]:disabled]:opacity-100",
        className,
      )}
    >
      {(title || description) && (
        <div className="flex flex-col gap-1 text-sm leading-5">
          {title && (
            <span
              id={titleId}
              className={cn(
                "font-medium",
                errorText ? "text-destructive" : "text-foreground",
              )}
            >
              {title}
            </span>
          )}
          {description && (
            <p id={descriptionId} className="text-muted-foreground">
              {description}
            </p>
          )}
        </div>
      )}
      <div className="pt-2">{children}</div>
      {errorText && (
        <p
          id={errorId}
          className="text-sm leading-5 font-medium text-destructive"
        >
          {errorText}
        </p>
      )}
    </fieldset>
  );
}
