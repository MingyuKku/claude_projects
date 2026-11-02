import { Bell } from "lucide-react";

import bellDotIcon from "@/shared/assets/img/header/bell-dot.svg";
import { cn } from "@/shared/lib/utils";

import { headerIconButtonClassName } from "./styles";

import type { ComponentProps } from "react";

interface HeaderAlertButtonProps extends Omit<
  ComponentProps<"button">,
  "children"
> {
  hasUnread?: boolean;
  label: string;
  // 읽지 않은 알림이 있을 때의 이름(예: "알림, 읽지 않은 알림 있음"). 없으면 label 을 씀.
  unreadLabel?: string;
}

export function HeaderAlertButton({
  hasUnread = false,
  label,
  unreadLabel,
  className,
  ...props
}: HeaderAlertButtonProps) {
  return (
    <button
      type="button"
      aria-label={hasUnread ? (unreadLabel ?? label) : label}
      className={cn(headerIconButtonClassName, "tablet:size-12", className)}
      {...props}
    >
      {hasUnread ? (
        <img src={bellDotIcon} alt="" aria-hidden="true" className="size-6" />
      ) : (
        <Bell className="size-6" />
      )}
    </button>
  );
}
