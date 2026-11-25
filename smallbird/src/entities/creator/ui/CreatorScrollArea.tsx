import { cn } from "@/shared/lib/utils";
import { ScrollArea } from "@/shared/ui/scroll-area";

import type { ComponentProps } from "react";

// Radix 안쪽 래퍼(display: table)는 내용 폭만큼 늘어나므로 세로 flex로 바꾸고, 빈 상태가 남는 높이를 채우게 함.
const VIEWPORT_CLASS_NAME =
  "[&>[data-slot=scroll-area-viewport]>div]:flex! [&>[data-slot=scroll-area-viewport]>div]:min-h-full [&>[data-slot=scroll-area-viewport]>div]:flex-col";

interface CreatorScrollAreaProps extends Omit<
  ComponentProps<typeof ScrollArea>,
  "type"
> {
  /** 스크롤되는 내용의 배치·안쪽 여백. */
  contentClassName?: string;
}

// 매칭 창·목록의 세로 스크롤. 스크롤바가 내용 위에 겹쳐 폭을 차지하지 않음.
export function CreatorScrollArea({
  className,
  contentClassName,
  children,
  ...props
}: CreatorScrollAreaProps) {
  return (
    <ScrollArea
      type="auto"
      className={cn("min-h-0", VIEWPORT_CLASS_NAME, className)}
      {...props}
    >
      <div className={cn("grow", contentClassName)}>{children}</div>
    </ScrollArea>
  );
}
