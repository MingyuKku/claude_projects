import { User } from "lucide-react";

import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";

import type { ReactNode } from "react";

interface HeaderGuestActionsProps {
  // 로그인 버튼 앞에 놓는 요소(이용 가이드·언어 메뉴)
  children?: ReactNode;
  loginLabel: string;
  onClickLogin?: () => void;
  className?: string;
}

export function HeaderGuestActions({
  children,
  loginLabel,
  onClickLogin,
  className,
}: HeaderGuestActionsProps) {
  return (
    <div className={cn("flex items-center gap-2 tablet:gap-3", className)}>
      {children}
      <Button
        variant="secondary"
        size="sm"
        className="cursor-pointer"
        onClick={onClickLogin}
      >
        <User />
        {loginLabel}
      </Button>
    </div>
  );
}
