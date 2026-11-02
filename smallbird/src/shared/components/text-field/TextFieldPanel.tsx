import { X } from "lucide-react";

import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";

import type { ReactNode } from "react";

// Figma Text Field(7085:112646) Charge Suggestion·Reject의 바깥 카드와 Header / Sub.
// 본문(금액 필드, 메시지 입력)은 children으로 조합함.
interface TextFieldPanelProps {
  title: string;
  closeLabel: string;
  onClickClose?: () => void;
  className?: string;
  children: ReactNode;
}

export function TextFieldPanel({
  title,
  closeLabel,
  onClickClose,
  className,
  children,
}: TextFieldPanelProps) {
  return (
    <section
      className={cn(
        "flex w-full flex-col overflow-hidden rounded-md border bg-background shadow-sm",
        className,
      )}
    >
      <header className="flex h-11.5 items-center gap-2 border-b py-0.5 pr-0.5 pl-4">
        <h3 className="min-w-0 flex-1 truncate text-sm leading-none font-semibold text-card-foreground">
          {title}
        </h3>
        <Button
          variant="ghost-foreground"
          size="icon"
          aria-label={closeLabel}
          onClick={onClickClose}
        >
          <X />
        </Button>
      </header>
      {children}
    </section>
  );
}
