import { cn } from "@/shared/lib/utils";
import { toastStyles } from "@/shared/ui/sonner";

import type { ReactNode } from "react";

// sonner 토스트와 같은 모양을 정적으로 그림(디자인 문서·미리보기용). 실제 알림은 sonner의 toast()를 씀.
interface ToastCardProps {
  title?: ReactNode;
  description?: ReactNode;
  actionLabel?: ReactNode;
  isDestructive?: boolean;
  className?: string;
}

export function ToastCard({
  title,
  description,
  actionLabel,
  isDestructive = false,
  className,
}: ToastCardProps) {
  return (
    <div
      role="status"
      data-type={isDestructive ? "error" : "default"}
      className={cn("relative w-97", toastStyles.toast, className)}
    >
      <div className={toastStyles.content}>
        {title && <div className={toastStyles.title}>{title}</div>}
        {description && (
          <div className={toastStyles.description}>{description}</div>
        )}
      </div>
      {actionLabel && (
        <button type="button" className={toastStyles.actionButton}>
          {actionLabel}
        </button>
      )}
    </div>
  );
}
