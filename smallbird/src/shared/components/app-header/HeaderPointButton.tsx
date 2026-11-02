import pointIcon from "@/shared/assets/img/header/point.svg";
import { cn } from "@/shared/lib/utils";

import { headerIconButtonClassName } from "./styles";

import type { ComponentProps } from "react";

interface HeaderPointButtonProps extends Omit<
  ComponentProps<"button">,
  "children"
> {
  // 표시용으로 포맷된 포인트 (예: "999,999")
  amount: string;
  label: string;
}

export function HeaderPointButton({
  amount,
  label,
  className,
  ...props
}: HeaderPointButtonProps) {
  return (
    <button
      type="button"
      aria-label={`${label} ${amount}`}
      className={cn(
        headerIconButtonClassName,
        "tablet:h-12 tablet:w-auto tablet:min-w-20 tablet:gap-2 tablet:rounded-md tablet:px-2.5 tablet:py-2",
        className,
      )}
      {...props}
    >
      <img src={pointIcon} alt="" aria-hidden="true" className="size-6" />
      <span className="hidden text-sm leading-6 font-medium tablet:inline">
        {amount}
      </span>
    </button>
  );
}
