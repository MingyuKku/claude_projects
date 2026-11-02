import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";

import { cn } from "@/shared/lib/utils";
import { Input } from "@/shared/ui/input";

import type { ComponentProps } from "react";

// Figma Input의 eye 변형: 필드 안 오른쪽 20px 아이콘으로 입력값 보기를 토글함.
interface PasswordInputProps extends Omit<
  ComponentProps<typeof Input>,
  "type"
> {
  showLabel: string;
  hideLabel: string;
}

export function PasswordInput({
  showLabel,
  hideLabel,
  className,
  disabled,
  ...props
}: PasswordInputProps) {
  const [isVisible, setIsVisible] = useState(false);
  const Icon = isVisible ? EyeOff : Eye;

  return (
    <div className="relative w-full">
      <Input
        {...props}
        disabled={disabled}
        type={isVisible ? "text" : "password"}
        className={cn("pr-10", className)}
      />
      <button
        type="button"
        disabled={disabled}
        aria-label={isVisible ? hideLabel : showLabel}
        onClick={() => setIsVisible((prev) => !prev)}
        className="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground outline-none focus-visible:text-foreground disabled:pointer-events-none"
      >
        <Icon className="size-5" />
      </button>
    </div>
  );
}
