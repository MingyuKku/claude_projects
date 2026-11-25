import { cn } from "@/shared/lib/utils";
import { Sheet, SheetContent, SheetTitle } from "@/shared/ui/sheet";

import type { ReactNode } from "react";

interface CreatorSheetProps {
  isOpen: boolean;
  title: string;
  onClose: () => void;
  /** 폭. */
  className: string;
  children: ReactNode;
}

// 매칭 PC 오른쪽 드로어 틀. 보이는 제목·닫기는 안의 `CreatorPanel`이 그림.
export function CreatorSheet({
  isOpen,
  title,
  onClose,
  className,
  children,
}: CreatorSheetProps) {
  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        side="right"
        showCloseButton={false}
        aria-describedby={undefined}
        overlayClassName="bg-foreground/10"
        className={cn("max-w-none tablet:max-w-none", className)}
      >
        <SheetTitle className="sr-only">{title}</SheetTitle>
        {children}
      </SheetContent>
    </Sheet>
  );
}
