import { cva } from "class-variance-authority";
import { useId } from "react";

import { cn } from "@/shared/lib/utils";
import { RadioGroupItem } from "@/shared/ui/radio-group";

import type { ComponentProps } from "react";

// Figma 디자인 시스템 Radio(6922:37639). 설명이 있으면 With text, outlined면 테두리 카드, 설명이 없으면 Group item.
const optionVariants = cva("flex gap-2", {
  variants: {
    variant: {
      plain: "",
      outlined: "rounded-md border border-border p-4",
    },
    hasDescription: {
      true: "items-start",
      false: "items-center",
    },
    indicatorPosition: {
      left: "",
      right: "flex-row-reverse",
    },
  },
  defaultVariants: {
    variant: "plain",
    hasDescription: false,
    indicatorPosition: "left",
  },
});

interface RadioOptionProps extends Omit<
  ComponentProps<typeof RadioGroupItem>,
  "id"
> {
  label: string;
  description?: string;
  variant?: "plain" | "outlined";
  indicatorPosition?: "left" | "right";
  isInvalid?: boolean;
}

export function RadioOption({
  label,
  description,
  variant,
  indicatorPosition,
  isInvalid = false,
  disabled,
  className,
  ...props
}: RadioOptionProps) {
  const id = useId();
  const hasDescription = Boolean(description);

  return (
    <div
      className={cn(
        optionVariants({ variant, hasDescription, indicatorPosition }),
        disabled &&
          "opacity-50 [&_[data-slot=radio-group-item]:disabled]:opacity-100",
        className,
      )}
    >
      <RadioGroupItem
        {...props}
        id={id}
        disabled={disabled}
        aria-invalid={isInvalid || undefined}
      />
      <label
        htmlFor={id}
        className="flex min-w-0 flex-1 flex-col gap-1 pt-px text-sm"
      >
        <span
          className={cn(
            "leading-none",
            hasDescription && "font-medium",
            isInvalid ? "text-destructive" : "text-foreground",
          )}
        >
          {label}
        </span>
        {description && (
          <span className="leading-5 text-muted-foreground">{description}</span>
        )}
      </label>
    </div>
  );
}
