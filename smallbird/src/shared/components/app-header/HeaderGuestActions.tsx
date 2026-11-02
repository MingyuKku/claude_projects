import { FileQuestionMark, User } from "lucide-react";

import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";

// 모바일은 Button md(40), desktop은 Button sm(36) 크기.
const GUEST_BUTTON =
  "cursor-pointer desktop:h-9 desktop:min-w-16 desktop:gap-1 desktop:px-2";

interface HeaderGuestActionsProps {
  guideLabel: string;
  loginLabel: string;
  onClickGuide?: () => void;
  onClickLogin?: () => void;
  className?: string;
}

export function HeaderGuestActions({
  guideLabel,
  loginLabel,
  onClickGuide,
  onClickLogin,
  className,
}: HeaderGuestActionsProps) {
  return (
    <div className={cn("flex items-center gap-1.5 desktop:gap-3", className)}>
      <Button
        variant="ghost-muted"
        className={GUEST_BUTTON}
        onClick={onClickGuide}
      >
        <FileQuestionMark />
        {guideLabel}
      </Button>
      <Button
        variant="secondary"
        className={GUEST_BUTTON}
        onClick={onClickLogin}
      >
        <User />
        {loginLabel}
      </Button>
    </div>
  );
}
