import { RotateCcw } from "lucide-react";

import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import { ScrollArea } from "@/shared/ui/scroll-area";

import type { ReactNode } from "react";

// Figma Chat List(5198:113612): Header / Sub(60px) 아래에 검색바·필터 칩·탭·목록이 순서대로 쌓임.
// 각 영역은 슬롯이라 Default(새 문의 버튼 + 탭)와 Search(검색 + 필터 + 탭) 구성을 모두 만듦.
interface ChatListPanelProps {
  title: string;
  /** 새로고침 버튼. 둘 다 주어질 때만 보임(구매자 문의 목록은 시안에 없음). */
  refreshLabel?: string;
  onClickRefresh?: () => void;
  /** 헤더 오른쪽 동작(예: 새 문의 버튼). */
  action?: ReactNode;
  /** 검색 입력 + 필터 버튼 줄. */
  search?: ReactNode;
  /** 적용된 필터 칩 줄. */
  filters?: ReactNode;
  tabs?: ReactNode;
  /** ChatListItem 목록. 비어 있으면 empty를 보여 줌. */
  children?: ReactNode;
  isEmpty?: boolean;
  empty?: ReactNode;
  className?: string;
}

export function ChatListPanel({
  title,
  refreshLabel,
  onClickRefresh,
  action,
  search,
  filters,
  tabs,
  children,
  isEmpty = false,
  empty,
  className,
}: ChatListPanelProps) {
  return (
    <section
      aria-label={title}
      className={cn(
        "flex flex-col overflow-hidden rounded-lg border border-border bg-background",
        className,
      )}
    >
      {/* MO는 Header / Sub / Mobile(54, 위 8·아래 12·좌우 16), 이후 검색·칩·탭 줄도 좌우 16·탭 위 8 */}
      <header className="flex h-13.5 shrink-0 items-center justify-between px-4 pt-2 pb-3 tablet:h-15 tablet:px-5 tablet:py-3">
        <div className="flex items-center gap-1">
          <h2 className="text-base leading-none font-semibold text-foreground">
            {title}
          </h2>
          {refreshLabel && onClickRefresh && (
            <Button
              variant="ghost-foreground"
              size="icon-xs"
              aria-label={refreshLabel}
              onClick={onClickRefresh}
            >
              <RotateCcw />
            </Button>
          )}
        </div>
        {action}
      </header>
      {search && (
        <div className="flex shrink-0 items-center gap-2 px-4 pb-2 tablet:px-5">
          {search}
        </div>
      )}
      {filters && (
        <div className="flex shrink-0 flex-wrap gap-2 px-4 py-2 tablet:px-5">
          {filters}
        </div>
      )}
      {/* MO는 Figma 변수 leading-5=16이라 탭 글자 줄이 16, 탭 묶음 36(TAB·PC는 20, 40). */}
      {tabs && (
        <div className="shrink-0 px-4 py-2 **:data-[slot=tabs-trigger]:leading-4 tablet:pt-3 tablet:**:data-[slot=tabs-trigger]:leading-5">
          {tabs}
        </div>
      )}
      {isEmpty ? (
        <div className="flex min-h-0 flex-1 items-center justify-center">
          {empty}
        </div>
      ) : (
        // 세로 목록에서 Radix 내부 table이 긴 문장에 맞춰 가로 폭을 늘리지 않도록 함.
        <ScrollArea className="min-h-0 flex-1 [&_[data-slot=scroll-area-viewport]>div]:block!">
          <ul className="flex flex-col">{children}</ul>
        </ScrollArea>
      )}
    </section>
  );
}
