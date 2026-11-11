import { cva } from "class-variance-authority";
import { Check, LoaderCircle, TriangleAlert, X } from "lucide-react";

import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";

import type { ReactNode } from "react";

// Figma Chat Base / Message Alert(5219:129953): 상담 요청 중(Loading)·실패(Error)·완료(Completed) 안내 카드.
const titleVariants = cva(
  "flex items-center gap-2 text-lg leading-6.5 font-semibold tablet:leading-7",
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
  // Figma 로더 링 지름 16: Lucide 는 size-5 에서 약 16.7이라 키우고, 차지하는 폭이 16 으로 남게 좌우를 당김
  loading: (
    <LoaderCircle aria-hidden="true" className="-mx-0.5 size-5 animate-spin" />
  ),
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
  /** 제목 줄 오른쪽 끝 X 버튼(Figma 11315:50280 완료 카드). 넘기면 버튼을 그림. */
  onClickClose?: () => void;
  closeLabel?: string;
  className?: string;
}

export function MessageAlert({
  status,
  title,
  description,
  caption,
  actions,
  onClickClose,
  closeLabel,
  className,
}: MessageAlertProps) {
  return (
    <div
      role={status === "error" ? "alert" : "status"}
      className={cn(
        // 시안 여백(MO 16·TAB 20·PC 24)은 테두리 바깥에서 잰 값이라 테두리 1px을 뺌
        "flex flex-wrap items-end justify-end gap-3 rounded-lg border border-border bg-background p-3.75 tablet:p-4.75 desktop:p-5.75",
        className,
      )}
    >
      {/* 최소 폭 262(Figma Body). 더 크면 MO(328)에서 내용이 왼쪽 여백을 침범함 */}
      <div className="flex min-w-65.5 flex-1 flex-col gap-2">
        <div className="flex items-start justify-between gap-2">
          <p className={titleVariants({ status })}>
            {STATUS_ICON[status]}
            {title}
          </p>
          {onClickClose && (
            <Button
              type="button"
              variant="ghost-foreground"
              size="icon-xss"
              aria-label={closeLabel}
              onClick={onClickClose}
            >
              <X aria-hidden="true" />
            </Button>
          )}
        </div>
        <div className="flex flex-col gap-0.5">
          <p className="text-sm leading-4 text-foreground tablet:leading-5">
            {description}
          </p>
          {caption && (
            <p className="text-xs leading-4 text-muted-foreground">{caption}</p>
          )}
        </div>
      </div>
      {actions && <div className="flex items-center gap-3">{actions}</div>}
    </div>
  );
}
