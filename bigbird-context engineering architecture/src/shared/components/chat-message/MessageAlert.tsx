import { cva } from "class-variance-authority";
import { Check, LoaderCircle, TriangleAlert } from "lucide-react";

import { cn } from "@/shared/lib/utils";

import type { ReactNode } from "react";

// Figma Chat Base / Message Alert(5219:129953): 상담 요청 중(Loading)·실패(Error)·완료(Completed) 안내 카드.
const titleVariants = cva(
  "flex items-center gap-2 text-lg leading-7 font-semibold",
  {
    variants: {
      status: {
        loading: "text-primary",
        error: "text-destructive",
        completed: "text-muted-foreground",
      },
    },
  },
);

const STATUS_ICON = {
  loading: <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />,
  error: <TriangleAlert aria-hidden="true" className="size-5" />,
  completed: <Check aria-hidden="true" className="size-5" />,
};

interface MessageAlertProps {
  status: "loading" | "error" | "completed";
  title: string;
  description: string;
  caption?: string;
  /** 오른쪽 아래 버튼 묶음(예: 재시도, 문의 메시지로 남기기). */
  actions?: ReactNode;
  className?: string;
}

export function MessageAlert({
  status,
  title,
  description,
  caption,
  actions,
  className,
}: MessageAlertProps) {
  return (
    <div
      role={status === "error" ? "alert" : "status"}
      className={cn(
        "flex flex-wrap items-end justify-end gap-3 rounded-lg border border-border bg-background p-6",
        className,
      )}
    >
      <div className="flex min-w-72 flex-1 flex-col gap-2">
        <p className={titleVariants({ status })}>
          {STATUS_ICON[status]}
          {title}
        </p>
        <div className="flex flex-col gap-0.5">
          <p className="text-sm leading-5 text-foreground">{description}</p>
          {caption && (
            <p className="text-xs leading-4 text-muted-foreground">{caption}</p>
          )}
        </div>
      </div>
      {actions && <div className="flex items-center gap-3">{actions}</div>}
    </div>
  );
}
