import { cva } from "class-variance-authority";
import { Copy } from "lucide-react";
import { useState } from "react";

import { cn } from "@/shared/lib/utils";

// Figma Chat Base / Card Type=Codebox(5198:105400 Medium, 6743:12967 Small):
// 캠페인 썸네일·이름·유형·기간과 복사 가능한 코드 줄.
const cardVariants = cva(
  "flex flex-col gap-2 rounded-lg border border-border bg-background p-3.5",
  {
    variants: {
      size: {
        // 모바일(시안 6791:54934)은 메시지 영역 폭 전체, 380px(w-95)는 넓은 화면의 상한.
        md: "w-full max-w-95",
        sm: "w-[243px]",
      },
    },
    defaultVariants: { size: "md" },
  },
);

const TEXT = {
  md: {
    body: "items-center",
    thumbnail: "size-20",
    details: "flex-1 gap-1",
    title: "text-base",
    description: "leading-5",
    period: "text-sm leading-5",
    codeRow: "px-2.5 py-2",
    codeLabel: "text-sm leading-none font-medium",
    code: "text-sm leading-5",
  },
  sm: {
    body: "items-start",
    thumbnail: "size-14",
    details: "flex-1 gap-1.5",
    title: "text-sm",
    description: "leading-none",
    period: "text-xs leading-4",
    codeRow: "px-2 py-1.5",
    codeLabel: "text-xs leading-4",
    code: "text-xs leading-4",
  },
};

interface ChatCodeCardProps {
  thumbnailSrc?: string;
  title: string;
  description: string;
  period?: string;
  codeLabel: string;
  code: string;
  copyLabel: string;
  onClickCopy?: () => void;
  size?: "md" | "sm";
  className?: string;
}

export function ChatCodeCard({
  thumbnailSrc,
  title,
  description,
  period,
  codeLabel,
  code,
  copyLabel,
  onClickCopy,
  size = "md",
  className,
}: ChatCodeCardProps) {
  const text = TEXT[size];
  // 주소가 깨져 로드에 실패한 썸네일은 깨진 아이콘 대신 숨김. 주소가 바뀌면 다시 시도함.
  const [failedSrc, setFailedSrc] = useState<string>();

  return (
    <article className={cn(cardVariants({ size }), className)}>
      <div className={cn("flex gap-3", text.body)}>
        {thumbnailSrc && thumbnailSrc !== failedSrc && (
          <img
            src={thumbnailSrc}
            alt=""
            onError={() => setFailedSrc(thumbnailSrc)}
            className={cn(
              "shrink-0 rounded-md border border-border object-cover",
              text.thumbnail,
            )}
          />
        )}
        <div className={cn("flex min-w-0 flex-col", text.details)}>
          <h3
            className={cn(
              "truncate leading-none font-semibold text-foreground",
              text.title,
            )}
          >
            {title}
          </h3>
          <p className={cn("text-sm text-foreground", text.description)}>
            {description}
          </p>
          {period && (
            <p className={cn("text-muted-foreground", text.period)}>{period}</p>
          )}
        </div>
      </div>
      <div
        className={cn(
          "flex items-center justify-between rounded-sm border border-border bg-muted/40 text-muted-foreground",
          text.codeRow,
        )}
      >
        <span className={text.codeLabel}>{codeLabel}</span>
        <span className="flex items-center gap-0.5">
          <button
            type="button"
            aria-label={copyLabel}
            onClick={onClickCopy}
            className="rounded-md p-0.5 text-foreground outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          >
            <Copy aria-hidden="true" className="size-4" />
          </button>
          <span className={text.code}>{code}</span>
        </span>
      </div>
    </article>
  );
}
