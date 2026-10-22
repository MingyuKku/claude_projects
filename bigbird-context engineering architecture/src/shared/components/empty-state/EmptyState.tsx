import { cva } from "class-variance-authority";

import { cn } from "@/shared/lib/utils";

import { EmptyIllustration } from "./EmptyIllustration";

import type { EmptyIllustrationType } from "./EmptyIllustration";
import type { ReactNode } from "react";

// Figma: No Message만 일러스트와 문구 간격이 20px.
const illustrationGroupVariants = cva("flex flex-col items-center", {
  variants: {
    isNoMessage: {
      true: "gap-5",
      false: "gap-4",
    },
  },
  defaultVariants: { isNoMessage: false },
});

// Figma Empty(6782:96546): 일러스트 → 제목·설명 → (선택) 버튼.
interface EmptyStateProps {
  type: EmptyIllustrationType;
  title: ReactNode;
  description?: ReactNode;
  /** Figma의 선택 버튼 자리. 보통 `<Button variant="outline">`을 넘김. */
  action?: ReactNode;
  className?: string;
}

export function EmptyState({
  type,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-6",
        className,
      )}
    >
      <div
        className={illustrationGroupVariants({
          isNoMessage: type === "no-message",
        })}
      >
        <EmptyIllustration type={type} />
        <div className="flex flex-col items-center gap-0.5 text-center">
          <p className="text-sm leading-5 font-medium text-muted-foreground">
            {title}
          </p>
          {description && (
            <p className="text-xs leading-4 text-slate-400">{description}</p>
          )}
        </div>
      </div>
      {action}
    </div>
  );
}
