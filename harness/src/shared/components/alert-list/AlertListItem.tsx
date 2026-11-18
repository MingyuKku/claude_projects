import { CircleCheck, CircleX } from "lucide-react";

import { cn } from "@/shared/lib/utils";

// Figma Alert List Base / Card Item(7318:173646): Type Success·Destructive × State Default·Disabled.
// Disabled는 읽은 알림이며, 읽지 않은 알림에는 오른쪽에 점을 표시함.
export interface AlertListItemData {
  id: string;
  type: "success" | "destructive";
  title: string;
  description: string;
  date: string;
  time: string;
  isRead?: boolean;
}

interface AlertListItemProps {
  item: AlertListItemData;
  className?: string;
}

const TYPE_ICON = {
  success: { Icon: CircleCheck, className: "text-success" },
  destructive: { Icon: CircleX, className: "text-destructive" },
} as const;

export function AlertListItem({ item, className }: AlertListItemProps) {
  const { Icon, className: iconClassName } = TYPE_ICON[item.type];
  return (
    <article
      className={cn(
        "flex items-start gap-3 bg-card px-5 pt-3 pb-4 text-card-foreground",
        item.isRead && "opacity-50",
        className,
      )}
    >
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <div className="flex flex-col gap-1">
          <h3 className="flex items-center gap-1.5 text-sm leading-none font-semibold">
            <Icon
              aria-hidden="true"
              className={cn("size-4 shrink-0", iconClassName)}
            />
            <span className="truncate">{item.title}</span>
          </h3>
          <p className="text-xs leading-5">{item.description}</p>
        </div>
        <p className="flex items-center gap-1 text-xs leading-4 text-muted-foreground">
          <span>{item.date}</span>
          <span>{item.time}</span>
        </p>
      </div>
      {/* 읽지 않음 점의 색은 Figma 값(blue-500)을 그대로 씀. 색 토큰은 여러 곳에서 같은 의미로 쓸 때만 추가함. */}
      {!item.isRead && (
        <span
          aria-hidden="true"
          className="size-2 shrink-0 rounded-full bg-blue-500"
        />
      )}
    </article>
  );
}
