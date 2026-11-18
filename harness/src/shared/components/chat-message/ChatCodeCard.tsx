import { cva } from "class-variance-authority";
import { Copy } from "lucide-react";
import { useState } from "react";

import { cn } from "@/shared/lib/utils";

// Figma Chat Base / Card Type=Codebox(5198:105400 Medium, 6743:12967 Small):
// 캠페인 썸네일·이름·유형·기간과 복사 가능한 코드 줄.
// Figma 테두리는 안쪽이라 패딩 14에서 1px을 뺌(코드 줄도 같음).
const cardVariants = cva(
  "flex flex-col gap-2 rounded-lg border border-border bg-background p-3.25",
  {
    variants: {
      size: {
        // 모바일(시안 6791:54934)은 메시지 영역 폭 전체, 380px(w-95)는 넓은 화면의 상한.
        md: "w-full max-w-95",
        // 상담 기록(6766:48772): 패널 폭을 채움
        sm: "w-full",
      },
    },
    defaultVariants: { size: "md" },
  },
);

const TEXT = {
  // Figma MO 변수는 leading-5 = 16(7817:143170·6791:67529), TAB·PC는 20
  md: {
    // 썸네일–글 간격은 MO 8, TAB·PC 12(Figma MO 49669·49864 Card Body)
    body: "items-center gap-2 tablet:gap-3",
    thumbnail: "size-20",
    details: "flex-1 gap-1",
    title: "text-base leading-none",
    description: "min-h-4 leading-4 tablet:min-h-5 tablet:leading-5",
    period: "text-sm leading-4 tablet:leading-5",
    codeRow: "px-2.25 py-1.75",
    codeLabel: "text-sm leading-none font-medium",
    code: "text-sm leading-4 tablet:leading-5",
  },
  sm: {
    // 썸네일은 65×65 고정이고 글은 내용 폭입니다(시안 6756:25745: PC 235·MO 328 모두 65). 다른 카드와 같게 맞추라는
    // 디자이너 요청(2026-10-23)으로, 남는 폭을 채우던 방식(2026-10-22)을 되돌렸습니다.
    // 긴 캠페인명이 글 폭을 늘리지 않게, 이름은 폭 계산에서 빼고(w-0 min-w-full) 유형·기간 줄 폭에 맞춰
    // 말줄임합니다. 기간이 없을 때를 위해 글 폭은 최소 120px입니다.
    body: "items-center gap-3",
    thumbnail: "size-16.25",
    details: "min-w-30 shrink gap-1.5",
    title: "w-0 min-w-full text-sm leading-none",
    // 시안은 유형·기간을 한 줄로 둡니다(whitespace-nowrap).
    // 아주 긴 유형명은 카드 밖으로 나가지 않게 말줄임합니다(아래 획 여유 -my-0.5 py-0.5).
    description: "-my-0.5 min-h-4.5 truncate py-0.5 leading-none",
    period: "text-xs leading-4 whitespace-nowrap",
    codeRow: "px-1.75 py-1.25",
    codeLabel: "text-xs leading-4",
    code: "text-xs leading-4",
  },
};

interface ChatCodeCardProps {
  thumbnailSrc?: string;
  title: string;
  /** 캠페인 유형 등. 값을 모르면 생략하며, 줄 자리는 비워 둡니다. */
  description?: string;
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
  // 주소가 없거나 로드에 실패하면 깨진 아이콘 대신 같은 크기의 빈 칸을 둬 시안 배치를 유지함. 주소가 바뀌면 다시 시도함.
  const [failedSrc, setFailedSrc] = useState<string>();
  const hasThumbnail = Boolean(thumbnailSrc) && thumbnailSrc !== failedSrc;

  return (
    <article className={cn(cardVariants({ size }), className)}>
      <div className={cn("flex", text.body)}>
        {hasThumbnail ? (
          <img
            src={thumbnailSrc}
            alt=""
            onError={() => setFailedSrc(thumbnailSrc)}
            className={cn(
              "shrink-0 rounded-md border border-border object-cover",
              text.thumbnail,
            )}
          />
        ) : (
          <div
            aria-hidden
            className={cn(
              "shrink-0 rounded-md border border-border bg-muted",
              text.thumbnail,
            )}
          />
        )}
        <div className={cn("flex min-w-0 flex-col", text.details)}>
          <h3
            className={cn(
              // 글자 크기 클래스가 leading-none을 덮어쓰지 않도록 크기·줄 높이는 text.title에 함께 둡니다.
              // leading-none + 말줄임이 g 같은 아래 획을 자르지 않게 위아래 2px 여유를 둡니다.
              "-my-0.5 truncate py-0.5 font-semibold text-foreground",
              text.title,
            )}
          >
            {title}
          </h3>
          {/* 유형(PICK형 등)은 카드 JSON에 없어 값이 없을 수 있습니다. 시안 높이를 지키려고 줄 자리는 늘 남깁니다. */}
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
