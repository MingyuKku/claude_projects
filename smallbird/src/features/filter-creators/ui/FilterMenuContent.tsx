import { cn } from "@/shared/lib/utils";
import { DropdownMenuContent } from "@/shared/ui/dropdown-menu";
import { ScrollArea } from "@/shared/ui/scroll-area";

import { MENU_MAX_VISIBLE_COUNT } from "../model/constants";

import type { ReactNode } from "react";

interface FilterMenuContentProps {
  itemCount: number;
  children: ReactNode;
}

// 항목이 많거나 화면이 낮으면 메뉴 안에서 스크롤함. 스크롤바는 항목 위에 겹침.
export function FilterMenuContent({
  itemCount,
  children,
}: FilterMenuContentProps) {
  return (
    <DropdownMenuContent
      align="start"
      className="min-w-(--radix-dropdown-menu-trigger-width) overflow-hidden"
    >
      <ScrollArea
        type="auto"
        className={cn(
          "*:data-[slot=scroll-area-viewport]:max-h-[calc(var(--radix-dropdown-menu-content-available-height)-var(--spacing)*2.5)] [&>[data-slot=scroll-area-viewport]>div]:block!",
          itemCount > MENU_MAX_VISIBLE_COUNT &&
            "*:data-[slot=scroll-area-viewport]:max-h-[min(calc(var(--spacing)*45),calc(var(--radix-dropdown-menu-content-available-height)-var(--spacing)*2.5))]",
        )}
      >
        {children}
      </ScrollArea>
    </DropdownMenuContent>
  );
}
