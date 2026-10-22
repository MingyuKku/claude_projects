import { ChevronDown, LogOut, Settings } from "lucide-react";

import { cn } from "@/shared/lib/utils";
import { Avatar, AvatarImage, AvatarPlaceholder } from "@/shared/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";

import type { ComponentProps } from "react";

// Figma Header / Profile(5058:76959) 트리거 + Header / Main / Dropdown(7334:157642).
// Profile의 Focus 상태(배경 흰색, chevron-up)는 메뉴가 열린 상태로 구현함.
interface UserMenuProps extends Pick<
  ComponentProps<typeof DropdownMenu>,
  "open" | "defaultOpen" | "onOpenChange" | "modal"
> {
  name: string;
  email: string;
  avatarSrc?: string;
  // 트리거 버튼의 접근성 이름 (모바일에서는 이름이 숨겨짐)
  menuLabel: string;
  settingsLabel: string;
  logoutLabel: string;
  onClickSettings?: () => void;
  onClickLogout?: () => void;
  isSettingsDisabled?: boolean;
  isLogoutDisabled?: boolean;
  className?: string;
  // 미리보기에서 hover·열림 상태 고정용 (data-preview-state, data-state 등)
  triggerProps?: ComponentProps<"button"> &
    Partial<Record<`data-${string}`, string>>;
}

interface UserAvatarProps {
  src?: string;
  size: "sm" | "lg";
}

function UserAvatar({ src, size }: UserAvatarProps) {
  return (
    <Avatar size={size}>
      {src && <AvatarImage src={src} alt="" />}
      <AvatarPlaceholder />
    </Avatar>
  );
}

export function UserMenu({
  name,
  email,
  avatarSrc,
  menuLabel,
  settingsLabel,
  logoutLabel,
  onClickSettings,
  onClickLogout,
  isSettingsDisabled = false,
  isLogoutDisabled = false,
  className,
  triggerProps,
  ...rootProps
}: UserMenuProps) {
  return (
    <DropdownMenu {...rootProps}>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={menuLabel}
          {...triggerProps}
          className={cn(
            "group/user-menu flex size-11 shrink-0 cursor-pointer items-center justify-center gap-1.5 rounded-md p-2.5 transition-colors outline-none hover:bg-accent focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 data-[state=open]:bg-background tablet:size-auto tablet:p-2",
            className,
            triggerProps?.className,
          )}
        >
          <span className="flex items-center gap-2">
            <UserAvatar src={avatarSrc} size="sm" />
            <span className="hidden max-w-24 truncate text-sm leading-5 font-semibold text-foreground tablet:inline">
              {name}
            </span>
          </span>
          <span className="hidden rounded-md p-0.5 text-foreground tablet:flex">
            <ChevronDown className="size-4 transition-transform group-data-[state=open]/user-menu:rotate-180" />
          </span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-66 p-0 shadow-md">
        <div className="p-1">
          <div className="flex items-start gap-2.5 rounded-md p-2">
            <UserAvatar src={avatarSrc} size="lg" />
            <div className="flex min-w-0 flex-1 flex-col justify-center gap-0.5 self-stretch text-sidebar-foreground">
              <p className="truncate text-sm leading-5 font-semibold">{name}</p>
              <p className="truncate text-xs leading-4">{email}</p>
            </div>
            <DropdownMenuItem
              aria-label={settingsLabel}
              onSelect={onClickSettings}
              disabled={isSettingsDisabled}
              className="size-5 min-h-0 min-w-0 shrink-0 cursor-pointer justify-center rounded-md p-0.5 text-foreground data-[disabled]:opacity-100"
            >
              <Settings className="size-4 text-foreground" />
            </DropdownMenuItem>
          </div>
        </div>
        <div className="border-t p-1">
          <DropdownMenuItem
            onSelect={onClickLogout}
            disabled={isLogoutDisabled}
            className="h-9 cursor-pointer gap-1.5 p-2 leading-none text-popover-foreground"
          >
            <LogOut className="size-5 text-foreground" />
            {logoutLabel}
          </DropdownMenuItem>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
