import { cva } from "class-variance-authority";
import { useId } from "react";

import { cn } from "@/shared/lib/utils";
import { Switch } from "@/shared/ui/switch";

import type { ComponentProps } from "react";

// Figma 디자인 시스템 Switch(6918:62631). Default(라벨만) · Description · Outlined(테두리 카드), 스위치 좌/우.
const optionVariants = cva("inline-flex items-center", {
  variants: {
    variant: {
      plain: "gap-2",
      outlined: "gap-4 rounded-lg border border-border p-4",
    },
    indicatorPosition: {
      left: "",
      right: "flex-row-reverse",
    },
  },
  defaultVariants: { variant: "plain", indicatorPosition: "left" },
});

interface SwitchOptionProps extends Omit<ComponentProps<typeof Switch>, "id"> {
  label: string;
  description?: string;
  variant?: "plain" | "outlined";
  indicatorPosition?: "left" | "right";
  isInvalid?: boolean;
}

export function SwitchOption({
  label,
  description,
  variant,
  indicatorPosition,
  isInvalid = false,
  disabled,
  className,
  ...props
}: SwitchOptionProps) {
  const id = useId();
  const hasDescription = Boolean(description);

  return (
    <div
      className={cn(
        optionVariants({ variant, indicatorPosition }),
        disabled && "opacity-50 [&_[data-slot=switch]:disabled]:opacity-100",
        className,
      )}
    >
      <Switch
        {...props}
        id={id}
        disabled={disabled}
        aria-invalid={isInvalid || undefined}
      />
      <label
        htmlFor={id}
        className={cn(
          "flex flex-col gap-1 text-sm",
          hasDescription && "min-w-0 flex-1",
        )}
      >
        <span
          className={cn(
            "leading-none font-medium",
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
