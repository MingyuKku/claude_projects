import { X } from "lucide-react";

import alarmIllustration from "@/shared/assets/img/empty/alarm.svg";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import { ScrollArea } from "@/shared/ui/scroll-area";

import { AlertListItem } from "./AlertListItem";

import type { AlertListItemData } from "./AlertListItem";

// Figma Alert List(7318:174033): State Default(목록)·Empty(알림 없음). 모바일(MO / Main Screen 7318:175091)은
// 제목줄 54px·닫기 아이콘 16px이고, tablet(768) 이상에서 PC 크기(제목줄 60px·아이콘 24px)가 됨.
// 목록 높이는 내용만큼이며(빈 상태 최소 465px), 스크롤하려면 className으로 높이(h-*)를 지정함.
interface AlertListProps {
  title: string;
  closeLabel: string;
  onClickClose?: () => void;
  items: AlertListItemData[];
  emptyTitle: string;
  emptyDescription?: string;
  className?: string;
}

export function AlertList({
  title,
  closeLabel,
  onClickClose,
  items,
  emptyTitle,
  emptyDescription,
  className,
}: AlertListProps) {
  return (
    <section
      aria-label={title}
      className={cn(
        "flex w-80 flex-col overflow-hidden rounded-lg border bg-card shadow-lg",
        className,
      )}
    >
      <header className="flex h-13.5 shrink-0 items-center gap-2 border-b bg-background py-1.5 pr-1 pl-4 tablet:h-15 tablet:pr-2 tablet:pl-5">
        <h2 className="flex-1 text-base leading-none font-semibold text-card-foreground">
          {title}
        </h2>
        <Button
          variant="ghost-foreground"
          size="icon-lg"
          className="size-10 tablet:size-12 [&_svg:not([class*='size-'])]:size-4 tablet:[&_svg:not([class*='size-'])]:size-6"
          aria-label={closeLabel}
          onClick={onClickClose}
        >
          <X />
        </Button>
      </header>
      {items.length === 0 ? (
        <div className="flex min-h-116.25 flex-1 flex-col items-center justify-center gap-4 p-4 text-center">
          <img src={alarmIllustration} alt="" className="size-12.5" />
          <div className="flex flex-col items-center gap-0.5">
            <p className="text-sm leading-5 font-medium text-muted-foreground">
              {emptyTitle}
            </p>
            {emptyDescription && (
              <p className="text-xs leading-4 text-balance whitespace-pre-line text-slate-400">
                {emptyDescription}
              </p>
            )}
          </div>
        </div>
      ) : (
        <ScrollArea className="min-h-0 flex-1">
          <ul className="flex flex-col py-4">
            {items.map((item) => (
              <li key={item.id}>
                <AlertListItem item={item} />
              </li>
            ))}
          </ul>
        </ScrollArea>
      )}
    </section>
  );
}
