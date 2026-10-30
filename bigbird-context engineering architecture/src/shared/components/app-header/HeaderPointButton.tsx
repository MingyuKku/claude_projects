import { CirclePlus } from "lucide-react";

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
        "group",
        headerIconButtonClassName,
        "tablet:h-12 tablet:w-auto tablet:min-w-20 tablet:gap-2 tablet:rounded-md tablet:px-2.5 tablet:py-2",
        className,
      )}
      {...props}
    >
      {/* 마우스를 올리면 P 아이콘을 충전(plus) 아이콘으로 바꿈(시안 5180:90873의 숨은 plus 아이콘). */}
      <img
        src={pointIcon}
        alt=""
        aria-hidden="true"
        className="size-6 group-hover:hidden group-focus-visible:hidden"
      />
      <CirclePlus
        aria-hidden="true"
        className="hidden size-6 text-primary group-hover:block group-focus-visible:block"
      />
      <span className="hidden text-sm leading-6 font-medium tablet:inline">
        {amount}
      </span>
    </button>
  );
}
