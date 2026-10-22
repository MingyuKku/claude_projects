import { Paperclip } from "lucide-react";

import { cn } from "@/shared/lib/utils";

interface FileDropHintProps {
  title: string;
  description?: string;
  iconClassName?: string;
}

// Figma Text Field Drag-Drop 상태의 안내. 바깥 테두리(ring)는 각 필드가 그림.
export function FileDropHint({
  title,
  description,
  iconClassName,
}: FileDropHintProps) {
  return (
    <>
      <Paperclip
        aria-hidden="true"
        className={cn("size-6 shrink-0 text-muted-foreground", iconClassName)}
      />
      <span className="flex w-full flex-col items-center gap-1 text-center">
        <span className="text-sm leading-5 text-muted-foreground">{title}</span>
        {description && (
          <span className="text-xs leading-4 text-slate-400">
            {description}
          </span>
        )}
      </span>
    </>
  );
}
