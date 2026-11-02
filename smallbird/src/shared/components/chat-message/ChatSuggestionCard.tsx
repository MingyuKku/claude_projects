import { cva } from "class-variance-authority";
import { CircleCheck, CircleX } from "lucide-react";

import { cn } from "@/shared/lib/utils";
import { Badge } from "@/shared/ui/badge";

import type { ComponentProps, ReactNode } from "react";

// Figma Chat Base / Card Type=Suggest·Re-Suggest·Accept·Reject(7083:103834 외).
// 헤더(배지 + 제목) / 구분선 / 결과 안내·금액·상세 / 버튼 줄. 문구는 모두 props.
const cardVariants = cva(
  "flex min-w-60.5 flex-col overflow-hidden rounded-lg border border-border bg-background",
  {
    variants: {
      size: {
        md: "w-95",
        sm: "w-[243px]",
      },
    },
    defaultVariants: { size: "md" },
  },
);

const noticeVariants = cva(
  "flex items-center gap-1.5 text-sm leading-5 font-semibold",
  {
    variants: {
      status: {
        accepted: "text-primary",
        rejected: "text-muted-foreground",
      },
    },
  },
);

interface SuggestionBadge {
  label: string;
  variant: NonNullable<ComponentProps<typeof Badge>["variant"]>;
}

interface SuggestionNotice {
  status: "accepted" | "rejected";
  text: string;
}

interface SuggestionDetail {
  label: string;
  value: string;
}

interface ChatSuggestionCardProps {
  badge: SuggestionBadge;
  title: string;
  notice?: SuggestionNotice;
  amountLabel: string;
  amount: string;
  /** 금액 오른쪽 보조 정보(예: 수수료 N %). */
  amountCaption?: ReactNode;
  details: SuggestionDetail[];
  /** 아래 버튼 줄(거절·다시 제안·수락, 결제 등). */
  actions?: ReactNode;
  size?: "md" | "sm";
  className?: string;
}

export function ChatSuggestionCard({
  badge,
  title,
  notice,
  amountLabel,
  amount,
  amountCaption,
  details,
  actions,
  size,
  className,
}: ChatSuggestionCardProps) {
  const NoticeIcon = notice?.status === "accepted" ? CircleCheck : CircleX;

  return (
    <article className={cn(cardVariants({ size }), className)}>
      <header className="flex items-center gap-1.5 border-b border-border p-4">
        <Badge variant={badge.variant} size="sm">
          {badge.label}
        </Badge>
        <h3 className="text-base leading-none font-semibold text-foreground">
          {title}
        </h3>
      </header>
      <div className="flex flex-col gap-3 p-4">
        {notice && (
          <p className={noticeVariants({ status: notice.status })}>
            <NoticeIcon aria-hidden="true" className="size-4 shrink-0" />
            {notice.text}
          </p>
        )}
        <div className="flex flex-col gap-1.5">
          <p className="text-xs leading-4 font-medium text-muted-foreground">
            {amountLabel}
          </p>
          <div className="flex items-end justify-between">
            <p className="text-xl leading-none font-semibold tracking-[-0.6px] text-foreground">
              {amount}
            </p>
            {amountCaption && (
              <p className="flex items-center gap-0.5 text-sm leading-none font-medium text-muted-foreground">
                {amountCaption}
              </p>
            )}
          </div>
        </div>
        <dl className="flex flex-col gap-1.5 text-xs leading-4">
          {details.map((detail) => (
            <div key={detail.label} className="flex flex-col gap-1.5">
              <dt className="font-medium text-muted-foreground">
                {detail.label}
              </dt>
              <dd className="text-foreground">{detail.value}</dd>
            </div>
          ))}
        </dl>
      </div>
      {actions && (
        <div className="flex items-center justify-end gap-2 px-4 pt-2 pb-4">
          {actions}
        </div>
      )}
    </article>
  );
}
