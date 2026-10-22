import { cva } from "class-variance-authority";

import { cn } from "@/shared/lib/utils";

// Figma Chat Base / Message Bubble(6756:29608): Me는 blue-100, Other는 흰 배경. 시간·편집됨 표시는 말풍선 바깥쪽 아래에 붙음.
const bubbleVariants = cva("rounded-lg text-foreground", {
  variants: {
    side: {
      me: "bg-blue-100",
      other: "bg-background",
    },
    size: {
      lg: "max-w-125 px-4 py-2.5 text-base leading-6",
      md: "max-w-85 px-4 py-2.5 text-base leading-6",
      sm: "max-w-50 px-3.5 py-2 text-sm leading-5",
    },
  },
  defaultVariants: { side: "other", size: "lg" },
});

export type MessageSide = "me" | "other";
export type MessageSize = "lg" | "md" | "sm";

interface MessageBubbleProps {
  /** 메시지 본문. HTML로 해석하지 않고 텍스트로만 렌더링함(XSS 방지). */
  message: string;
  side?: MessageSide;
  size?: MessageSize;
  time?: string;
  /** 편집된 메시지일 때 시간 위에 붙는 문구(예: "편집됨"). */
  editedLabel?: string;
  className?: string;
}

export function MessageBubble({
  message,
  side = "other",
  size = "lg",
  time,
  editedLabel,
  className,
}: MessageBubbleProps) {
  const hasMeta = Boolean(time || editedLabel);

  return (
    <div
      className={cn(
        "flex items-end gap-2",
        side === "me" && "flex-row-reverse",
        className,
      )}
    >
      <p
        className={cn(
          bubbleVariants({ side, size }),
          "break-words whitespace-pre-wrap",
        )}
      >
        {message}
      </p>
      {hasMeta && (
        <p className="flex shrink-0 flex-col gap-0.5 text-xs leading-4 whitespace-nowrap text-muted-foreground">
          {editedLabel && <span>{editedLabel}</span>}
          {time && <time>{time}</time>}
        </p>
      )}
    </div>
  );
}
